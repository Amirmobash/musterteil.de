"""Original procedural FDM scene. Blender 4.3: blender -b -t 4 -P tools/render_lab.py
Frames go to /tmp/musterteil-video; encode with commands documented in assets/video/LICENSE.md.
"""
import bpy, math, os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
s=bpy.context.scene
s.render.engine='CYCLES'; s.cycles.samples=24
s.cycles.use_denoising=False
s.render.resolution_x=768; s.render.resolution_y=432; s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG'; s.render.fps=24
s.world.color=(.003,.004,.006)
def mat(name,color,metal=0,rough=.35,emission=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 b=m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value=(*color,1); b.inputs['Metallic'].default_value=metal; b.inputs['Roughness'].default_value=rough
 if emission: b.inputs['Emission Color'].default_value=(*color,1); b.inputs['Emission Strength'].default_value=emission
 return m
black=mat('Graphite aluminium',(.025,.031,.038),.8); steel=mat('Machined steel',(.18,.21,.24),.85,.23)
orange=mat('Orange ABS',(.95,.16,.018),.1,.29); brass=mat('Brass nozzle',(.5,.27,.07),.8)
glow=mat('Amber inspection light',(1,.15,.015),0,.4,7); bed=mat('Textured build surface',(.045,.049,.055),.5,.65)
def cube(name,loc,scale,material,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(material)
 if bevel: mod=o.modifiers.new('Machined edges','BEVEL'); mod.width=bevel; mod.segments=3; o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def cyl(name,loc,r,depth,material):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc); o=bpy.context.object; o.name=name; o.data.materials.append(material); return o
cube('Build plate',(0,0,-.12),(7,7,.22),bed)
cube('Printer base',(0,0,-.5),(8,8,.55),black)
for x in [-3.7,3.7]:
 cube('Frame',(x,2.6,3.1),(.32,.5,7),black)
 cube('Light strip',(x-.02,2.28,3.4),(.065,.04,5.5),glow,.01)
cube('Crossbar',(0,2.6,6.3),(7.8,.6,.55),black)
for y in [-2.8,2.8]:
 o=cyl('Linear rail',(0,y,3.3),.09,7.5,steel); o.rotation_euler[1]=math.pi/2
# A layered rounded rectangular part, with individual deposited filament contours.
def line(name,points,material,r=.025):
 c=bpy.data.curves.new(name,'CURVE'); c.dimensions='3D'; c.bevel_depth=r; c.bevel_resolution=2
 p=c.splines.new('POLY'); p.points.add(len(points)-1)
 for q,co in zip(p.points,points): q.co=(*co,1)
 o=bpy.data.objects.new(name,c); bpy.context.collection.objects.link(o); o.data.materials.append(material); return o
for layer in range(36):
 z=.055+layer*.036
 points=[]
 for j in range(129):
  a=j/128*2*math.pi; points.append((1.32*math.copysign(abs(math.cos(a))**.45,math.cos(a)),1.1*math.copysign(abs(math.sin(a))**.45,math.sin(a)),z))
 line('Deposited ABS layer',points,orange,.025)
z=.055+36*.036
# Animated hotend follows the same continuous outer contour.
head=bpy.data.objects.new('Moving hotend',None); bpy.context.collection.objects.link(head)
parts=[cube('Heatsink',(0,0,z+1.03),(.85,.8,.8),black),cube('Heater block',(0,0,z+.37),(.4,.36,.26),steel),cyl('Heatbreak',(0,0,z+.62),.12,.3,steel)]
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.035,radius2=.16,depth=.28,location=(0,0,z+.16)); bpy.context.object.data.materials.append(brass); parts.append(bpy.context.object)
for k in range(5): parts.append(cube('Cooling fin',(0,0,z+.66+k*.11),(.6,.62,.045),steel,.01))
parts.append(cube('Hotend indicator',(0,-.415,z+1.05),(.35,.025,.04),glow,.01))
for o in parts: o.parent=head
trace=line('Fresh filament',[(1.32*math.copysign(abs(math.cos(j/128*2*math.pi))**.45,math.cos(j/128*2*math.pi)),1.1*math.copysign(abs(math.sin(j/128*2*math.pi))**.45,math.sin(j/128*2*math.pi)),z) for j in range(129)],orange,.027)
for frame in range(1,73):
 a=(frame-1)/72*2*math.pi
 trace.data.bevel_factor_end=(frame-1)/72; trace.data.keyframe_insert('bevel_factor_end',frame=frame)
 head.location=(1.32*math.copysign(abs(math.cos(a))**.45,math.cos(a)),1.1*math.copysign(abs(math.sin(a))**.45,math.sin(a)),0); head.keyframe_insert('location',frame=frame)
# Film lighting, shallow depth of field and a slow looping camera arc.
def area(name,loc,color,power,size,target=(0,0,1)):
 bpy.ops.object.light_add(type='AREA',location=loc); o=bpy.context.object; o.name=name; o.data.color=color; o.data.energy=power; o.data.shape='DISK'; o.data.size=size; o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Warm key',(-3,-2,5),(1,.32,.085),850,4); area('Cool softbox',(4,1,5),(.4,.58,1),650,4); area('Edge glow',(-2,4,3),(1,.16,.025),950,3)
bpy.ops.object.camera_add(); cam=bpy.context.object; s.camera=cam; cam.data.lens=46
focus=bpy.data.objects.new('Focus at nozzle',None); bpy.context.collection.objects.link(focus); focus.location=(0,0,1.7); cam.data.dof.use_dof=True; cam.data.dof.focus_object=focus; cam.data.dof.aperture_fstop=5.6
for frame in range(1,73):
 a=(frame-1)/72*2*math.pi; cam.location=(7.5+.2*math.sin(a),-10+.2*math.cos(a),6.4); cam.rotation_euler=(Vector((0,0,1.8))-cam.location).to_track_quat('-Z','Y').to_euler(); cam.keyframe_insert('location',frame=frame); cam.keyframe_insert('rotation_euler',frame=frame)
s.frame_start=1; s.frame_end=72
os.makedirs('/tmp/musterteil-video',exist_ok=True); s.render.filepath='/tmp/musterteil-video/frame-'
bpy.ops.wm.save_as_mainfile(filepath='/tmp/musterteil-video/lab.blend')
bpy.ops.render.render(animation=True)
