"""Original ZEMNE sanctuary. Blender 4.5 LTS headless build, glTF + matching Cycles stills.
Usage: blender -b --python scripts/3d/build-sanctuary.py -- --root REPO --materials MAP_DIRECTORY
No downloaded architectural models, no personal data. Poly Haven maps are CC0.
"""
import bpy, math, random, os, sys, argparse, json
from mathutils import Vector
random.seed(17)
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
a=argparse.ArgumentParser();a.add_argument('--root',required=True);a.add_argument('--materials',required=True);a.add_argument('--quick',action='store_true');args=a.parse_args(argv)
ROOT=args.root; OUT=os.path.join(ROOT,'public','3d');os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=4
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=90
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0.2
mats={}
def mat(name,col,rough=.7,metal=0,texture=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*col,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if texture:
  for suffix,socket in [('Diffuse','Base Color'),('Rough','Roughness'),('nor_gl','Normal')]:
   path=os.path.join(args.materials,texture+'-'+suffix+'.jpg');im=bpy.data.images.load(path,check_existing=True);t=n.new('ShaderNodeTexImage');t.image=im
   if suffix!='Diffuse': im.colorspace_settings.name='Non-Color'
   if suffix=='nor_gl':
    normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.35;l.new(t.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs['Normal'],bs.inputs[socket])
   else:l.new(t.outputs['Color'],bs.inputs[socket])
 m.diffuse_color=(*col,1);mats[name]=m;return m
stone=mat('Honed limestone',(.64,.6,.5),.82,texture='limestone')
floorstone=mat('Honed ivory marble',(.72,.69,.61),.75,texture='floor')
plaster=mat('Warm mineral plaster',(.72,.69,.61),.92)
wood=mat('Natural smoked oak',(.23,.13,.065),.58,texture='oak')
bronze=mat('Satin architectural bronze',(.31,.2,.095),.34,.78)
forest=mat('Deep olive limewash',(.075,.105,.085),.94)
fabric=mat('Woven olive upholstery',(.15,.18,.145),.98)
paper=mat('Ivory rag paper',(.83,.79,.67),.93)
leafmat=mat('Natural foliage',(.13,.19,.09),.8)
flower=mat('Ivory hellebore petals',(.76,.72,.61),.73)
ceramic=mat('Unglazed ceramic',(.49,.46,.38),.83)
glass=mat('Architectural glazing',(.7,.82,.81),.15);g=glass.node_tree.nodes.get('Principled BSDF');g.inputs['Transmission Weight'].default_value=.85;g.inputs['IOR'].default_value=1.45
lightmat=mat('Warm concealed light',(.8,.61,.33),.6);bs=lightmat.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.7,.35,1);bs.inputs['Emission Strength'].default_value=2
objects=[]
def finish(obj,name,material,dest=None):
 obj.name=name
 if material:obj.data.materials.append(material)
 if dest:obj['destination']=dest
 if obj.type=='MESH':
  for p in obj.data.polygons:p.use_smooth=True
  objects.append(obj)
 return obj
def box(name,loc,dim,material,bevel=.03,dest=None,rot=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dim
 if rot:o.rotation_euler=rot
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Crafted eased edges','BEVEL');mod.width=bevel;mod.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
  norm=o.modifiers.new('Weighted architectural normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=norm.name)
 return finish(o,name,material,dest)
def mesh(name,verts,faces,material,dest=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return finish(o,name,material,dest)
def curve(name,pts,radius,material,dest=None):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=3;c.resolution_u=12;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return finish(o,name,material,dest)
def lathe(name,loc,profile,material,dest=None,segments=32):
 vs=[];fs=[]
 for z,r in profile:
  for i in range(segments):t=i/segments*math.tau;vs.append((loc[0]+r*math.cos(t),loc[1]+r*math.sin(t),loc[2]+z))
 for j in range(len(profile)-1):
  for i in range(segments):k=j*segments+i;ni=j*segments+(i+1)%segments;fs.append((k,ni,ni+segments,k+segments))
 fs += [tuple(range(segments-1,-1,-1)),tuple((len(profile)-1)*segments+i for i in range(segments))]
 return mesh(name,vs,fs,material,dest)
def text(name,body,loc,size,material,dest=None,rot=(math.pi/2,0,0)):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.size=size;c.extrude=.0008;c.align_x='CENTER';c.space_character=1.25;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return finish(o,name,material,dest)
# A real enclosed room, open only at its entrance and carefully framed glazing.
floor=box('Continuous honed stone floor',(0,0,-.15),(10.4,14.6,.3),floorstone,.02)
box('East limestone wall',(5.15,0,2.5),(.3,14.4,5),plaster)
box('West low sill',(-5.15,0,.28),(.3,14.4,.56),stone)
box('West clerestory header',(-5.15,0,4.6),(.3,14.4,.8),plaster)
box('Memorial back wall',(0,7.05,2.5),(10.4,.3,5),stone)
box('Entry left pier',(-3.7,-7.05,2.5),(2.9,.3,5),stone)
box('Entry right pier',(3.7,-7.05,2.5),(2.9,.3,5),stone)
box('Entry lintel',(0,-7.05,4.65),(4.7,.3,.7),plaster)
# Solid ceiling with a single central rooflight, not an exposed slat pergola.
for x in [-3.15,3.15]:box('Solid ceiling plane',(x,0,5.04),(4.0,14.4,.22),plaster)
for x in [-1.12,1.12]:
 box('Rooflight bronze edge',(x,0,5.03),(.055,14,.13),bronze,.008)
 box('Indirect ceiling ribbon',(x+(.09 if x>0 else -.09),0,4.94),(.055,13.8,.018),lightmat,.003)
box('Rooflight glazing',(0,0,5.18),(2.2,14,.035),glass,.003)
# Timber ceiling panels with closely spaced architectural reveals.
for side in [-1,1]:
 for i in range(14):box('Oak ceiling coffer',(side*3.22,-6.5+i,.4+4.49),(3.75,.94,.055),wood,.01)
for y in [-6.5,-4.5,-2.5,-.5,1.5,3.5,5.5,6.7]:
 box('Bronze window mullion',(-5.02,y,2.4),(.055,.055,3.9),bronze,.008)
box('West transparent glazing',(-5.07,0,2.4),(.025,13.5,3.8),glass,.002)
for z in [.51,4.26]:box('Glazing bronze rail',(-5.01,0,z),(.06,13.8,.06),bronze,.008)
for x in [-4.99,4.99]:
 box('Stone shadow gap',(x,0,.12),(.018,14,.06),bronze,.003)
 box('Lower wall wash',(x,0,.18),(.02,13.8,.018),lightmat,.003)
# Floor joints and a single quiet aisle inlay.
for y in range(-6,8,2):box('Stone floor joint',(0,y,.004),(10,.008,.006),ceramic,.001)
for x in [-3.3,-1.1,1.1,3.3]:box('Floor slab joint',(x,0,.004),(.006,14,.006),ceramic,.001)
for x in [-.82,.82]:box('Aisle bronze inlay',(x,1,.008),(.012,10,.007),bronze,.001)
# Softly rounded feature recess and framed original abstract portrait.
box('Central olive niche',(0,6.78,2.45),(4.45,.16,3.85),forest,.15)
for x in [-2.32,2.32]:box('Niche warm edge',(x,6.68,2.4),(.035,.025,3.6),lightmat,.006)
box('Portrait bronze reveal',(0,6.55,2.55),(1.85,.12,2.3),bronze,.035)
box('Portrait oak mat',(0,6.47,2.55),(1.74,.04,2.18),wood,.015)
# Original abstract artwork drawn as layered relief. Neutral placeholder, not a real person.
box('Portrait warm paper',(0,6.44,2.55),(1.6,.025,2.04),paper,.008)
mesh('Abstract landscape silhouette',[(-.8,6.42,1.54),(.8,6.42,1.54),(.8,6.42,2.35),(.4,6.42,2.6),(-.1,6.42,2.45),(-.5,6.42,2.1),(-.8,6.42,2.2)],[tuple(range(7))],forest)
mesh('Abstract limestone horizon',[(-.8,6.415,1.54),(.8,6.415,1.54),(.8,6.415,1.9),(.2,6.415,2.13),(-.4,6.415,1.95),(-.8,6.415,2.04)],[tuple(range(6))],ceramic)
box('Memorial floating plinth',(0,5.8,.58),(2.85,1.0,1.16),stone,.11)
box('Memorial bronze lip',(0,5.8,1.17),(2.89,1.04,.035),bronze,.01)
text('Memorial inscription','A LIFE, HELD IN MEMORY',(0,5.28,.72),.105,bronze)
# Real bench profiles: extruded curved cross-section and eased upholstery.
def bench(x,y):
 profile=[(-.38,.48),(-.42,.56),(-.39,.67),(-.28,.71),(.34,.69),(.4,.62),(.36,.52)]
 vs=[(x+dx,y+dy,z) for dx in [-1.05,1.05] for dy,z in profile];n=len(profile);fs=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 o=mesh('Sculpted oak bench shell',vs,fs,wood);bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Seat edge radius','BEVEL');mod.width=.06;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
 box('Upholstered seat',(x,y,.69),(2,.72,.12),fabric,.055)
 box('Upholstered back',(x,y-.34,1.0),(2,.12,.6),fabric,.07,rot=(math.radians(-7),0,0))
 for dx in [-.82,.82]:
  curve('Bronze chair frame',[(x+dx,y-.3,.05),(x+dx,y-.3,.6),(x+dx,y-.36,1.25)],.024,bronze)
  curve('Bronze front leg',[(x+dx,y+.28,.05),(x+dx,y+.28,.6)],.024,bronze)
for x in [-2.7,2.7]:
 for y in [.1,1.9,3.7]:bench(x,y)
# Guestbook pedestal with a modeled open book and visible engraved destination.
x,y=-2.65,-3.35
lathe('Guestbook bronze foot',(x,y,0),[(0,.52),(.06,.55),(.12,.46),(.17,.2),(1.0,.14),(1.08,.42)],bronze,'guestbook')
box('Guestbook crafted oak surface',(x,y,1.14),(1.65,.92,.13),wood,.09,'guestbook',rot=(.12,0,0))
box('Linen book binding',(x,y,1.23),(1.15,.67,.06),forest,.025,'guestbook',rot=(.12,0,0))
for side in [-1,1]:
 vs=[];fs=[]
 for j in range(9):
  u=j/8;xx=side*(.015+u*.53);zz=1.29+.045*math.sin(u*math.pi)
  vs.extend([(x+xx,y-.29,zz-.035),(x+xx,y+.29,zz+.035)])
 for j in range(8):fs.append((j*2,j*2+1,j*2+3,j*2+2))
 mesh('Curved guestbook pages',vs,fs,paper,'guestbook')
text('Guestbook destination','GUESTBOOK',(x,y-.475,1.07),.08,bronze,'guestbook')
# Tribute lectern: sculpted, tapered stone and bronze writing surface.
x,y=3.3,-1.75
lathe('Tribute limestone pedestal',(x,y,0),[(0,.46),(.08,.48),(.16,.35),(.85,.23),(1.15,.42),(1.2,.46)],stone,'tribute',48)
box('Tribute writing desk',(x,y,1.25),(1.3,.85,.075),bronze,.075,'tribute',rot=(.1,0,0))
box('Tribute linen folio',(x,y,1.32),(.72,.53,.04),paper,.015,'tribute',rot=(.1,0,0))
text('Tribute destination','TRIBUTES',(x,y-.46,.99),.085,bronze,'tribute')
# A memory wall panel, physically fixed to the side wall and angled toward the aisle.
box('Memory wall bronze surround',(4.83,4.5,2.25),(.14,2.45,2.3),bronze,.04,'wall')
box('Memory wall paper panel',(4.74,4.5,2.25),(.04,2.28,2.14),paper,.025,'wall')
text('Memory wall destination','MEMORY WALL',(4.7,4.5,2.85),.13,bronze,'wall',rot=(math.pi/2,0,-math.pi/2))
for z in [2.48,2.3,2.12,1.94]:box('Engraved remembrance line',(4.71,4.5,z),(.012,1.65,.008),bronze,.002,'wall')
# Organic sculptural stems and leaves, no sphere-based topiary.
def arrangement(x,y,z):
 lathe('Hand-thrown stoneware vessel',(x,y,z),[(0,.18),(.08,.25),(.4,.3),(.57,.19),(.65,.14)],ceramic)
 for i in range(7):
  theta=i*2.4;dx=.35*math.cos(theta);dy=.3*math.sin(theta);h=.9+random.random()*.45
  curve('Botanical stem',[(x,y,z+.4),(x+dx*.4,y+dy*.4,z+.95),(x+dx,y+dy,z+h+.5)],.008,leafmat)
  for j in [0,1]:
   zz=z+.78+j*.25;cx=x+dx*(.35+j*.25);cy=y+dy*(.35+j*.25)
   verts=[(cx,cy,zz),(cx+.2*math.cos(theta+.8),cy+.2*math.sin(theta+.8),zz+.1),(cx+.33*math.cos(theta),cy+.33*math.sin(theta),zz+.18),(cx+.15*math.cos(theta-.8),cy+.15*math.sin(theta-.8),zz+.05)]
   mesh('Botanical leaf',verts,[(0,1,2),(0,2,3)],leafmat)
  for j in range(5):
   th=j*math.tau/5;cx=x+dx;cy=y+dy;cz=z+h+.5
   verts=[(cx,cy,cz),(cx+.07*math.cos(th-.7),cy+.07*math.sin(th-.7),cz+.02),(cx+.13*math.cos(th),cy+.13*math.sin(th),cz+.06),(cx+.07*math.cos(th+.7),cy+.07*math.sin(th+.7),cz+.02)]
   mesh('Hellebore petal',verts,[(0,1,2,3)],flower)
arrangement(-1.05,5.85,1.2);arrangement(4.1,5.9,0)
# A planted light court beyond west glazing gives a real near/far depth cue.
box('Light court ground',(-7,0,-.13),(3.5,15,.22),ceramic)
for y in [-5,-1,3,6]:arrangement(-6.1,y,0)
box('Garden boundary',(-8.5,0,1.0),(.12,15,2),forest,.02)
# Apply transforms, project material UVs in physical meters, then merge by material+destination.
for o in list(objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.select_set(False)
 uv=o.data.uv_layers.new(name='MaterialUV') if not o.data.uv_layers else o.data.uv_layers.active
 for poly in o.data.polygons:
  axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[k for k in range(3) if k!=axis]
  for li in poly.loop_indices:
   co=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]/2.5,co[axes[1]]/2.5)
# glTF merge keeps interaction ownership and reduces draw calls.
groups={}
for o in list(objects):
 key=(o.data.materials[0].name,o.get('destination',''))
 if o==floor:continue
 groups.setdefault(key,[]).append(o)
for (material,dest),items in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in items:o.select_set(True)
 bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join();o=bpy.context.object;o.name=(dest+'_' if dest else '')+material
 if dest:o['destination']=dest
# Match the live renderer's broad daylight and warm architectural fill.
world=bpy.data.worlds.new('Sanctuary daylight');scene.world=world;world.use_nodes=True;n=world.node_tree.nodes;l=world.node_tree.links;env=n.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(os.path.join(OUT,'sanctuary-light.hdr'));l.new(env.outputs['Color'],n.get('Background').inputs['Color']);n.get('Background').inputs['Strength'].default_value=.25
def area(name,loc,power,col,size,target):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=col;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('West daylight',(-4.8,-1,3.4),1800,(.86,.91,1),5,(0,2,0))
area('Rooflight daylight',(0,1,5.6),1600,(1,.91,.77),5,(0,2,0))
area('Memorial gentle wash',(0,4.8,4.6),400,(1,.78,.5),3,(0,6,2))
d=bpy.data.lights.new('Sun through glazing','SUN');d.energy=1.5;d.angle=.07;o=bpy.data.objects.new('Sun through glazing',d);bpy.context.collection.objects.link(o);o.rotation_euler=(.4,-.7,-.5)
# Export GLB. Texture maps remain embedded; no remote runtime dependency.
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type=='MESH':o.select_set(True)
options=dict(filepath=os.path.join(OUT,'sanctuary.glb'),export_format='GLB',use_selection=True,export_extras=True,export_materials='EXPORT',export_image_format='AUTO',export_yup=True)
bpy.ops.export_scene.gltf(**options)
triangles=sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH')
manifest={'model':'sanctuary.glb','blender':bpy.app.version_string,'mesh_objects':len([o for o in scene.objects if o.type=='MESH']),'polygons':triangles,'bytes':os.path.getsize(os.path.join(OUT,'sanctuary.glb')),'destinations':['guestbook','tribute','wall'],'source':'scripts/3d/build-sanctuary.py','architecture':'Original ZEMNE Garden of Light sanctuary','portrait':'Original abstract relief; neutral placeholder, not a real person','baked_lighting':False}
with open(os.path.join(OUT,'sanctuary-manifest.json'),'w') as f:json.dump(manifest,f,indent=2)
# Matching stills are rendered from the exact model, never substituted for live WebGL.
bpy.ops.object.camera_add(location=(.3,-6.45,1.85));cam=bpy.context.object;scene.camera=cam;cam.data.lens=23;cam.rotation_euler=(Vector((0,4.8,2.0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.clip_start=.05
scene.render.resolution_x=1600;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
if args.quick:scene.cycles.samples=12;scene.render.resolution_percentage=60
scene.render.filepath=os.path.join(OUT,'sanctuary-entrance-v1.webp');bpy.ops.render.render(write_still=True)
for name,loc,target in [('guestbook',(-.5,-5.5,1.85),(-2.65,-3.35,1.2)),('tribute',(1.6,-4.0,1.7),(3.3,-1.75,1.1)),('wall',(1.3,2.6,1.85),(4.8,4.5,2.3))]:
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=29;scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.filepath=os.path.join(OUT,'sanctuary-'+name+'-v1.webp');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.materials,'zemne-sanctuary.blend'))
print('ZEMNE_SANCTUARY_BUILD',json.dumps(manifest))
