"""Dựng `public/models/fox2.glb` (Cáo con) từ khối xám Hunyuan3D 2.0.
Cách dùng: python3 scripts/3d/make-kit-fox.py white_mesh.glb public/models/fox2.glb
Cần: pip install trimesh numpy scipy networkx fast-simplification
Các bước: bỏ tấm nền dính liền, giữ mảnh lớn nhất, giảm còn ~7000 mặt, tô màu theo vùng (cam, trắng, tối) bằng màu đỉnh.
Các hằng số vùng (yn = chiều cao chuẩn hóa, ngưỡng x/z) đo cho đúng mô hình này; mô hình khác phải đo lại."""
import sys, numpy as np, trimesh
from trimesh.visual.material import PBRMaterial

src, dst = sys.argv[1], sys.argv[2]
m = trimesh.load(src, force="mesh")
V = m.vertices
slab_top = np.sort(V[:, 1])[:1].item() + 0.0123  # tấm nền dày ~0.012 ở đáy
keep = ~(V[m.faces][:, :, 1] < slab_top).all(1)
m = trimesh.Trimesh(V, m.faces[keep], process=False)
m.remove_unreferenced_vertices()
m = sorted(m.split(only_watertight=False), key=lambda p: -len(p.faces))[0]
m = m.simplify_quadric_decimation(face_count=7000)

V = np.asarray(m.vertices); F = np.asarray(m.faces); N = np.asarray(m.vertex_normals)
x, y, z = V[:, 0], V[:, 1], V[:, 2]
yn = (y - y.min()) / np.ptp(y)
ORANGE = np.array([255, 140, 40.]); WHITE = np.array([255, 252, 244.]); DARK = np.array([70, 42, 30.]); PINK = np.array([255, 205, 195.])
col = np.tile(ORANGE, (len(V), 1))
def blend(w, c):
    w = np.clip(w, 0, 1)[:, None]; col[:] = col * (1 - w) + c * w
sm = lambda v, a, b: np.clip((v - a) / (b - a), 0, 1)
tail = (z < -0.115) & (yn < 0.55)
head = (yn > 0.40) & (~tail) & (z > -0.12)
body = (~tail) & (~head)
blend(((N[:, 2] > 0.3) & body & (yn > 0.1)).astype(float) * sm(0.075 - np.abs(x), 0, 0.02), WHITE)
lim = 0.50 + 0.08 * np.clip(np.abs(x) / 0.15, 0, 1)
blend((head & (N[:, 2] > 0.0)).astype(float) * sm(lim - yn, 0, 0.03), WHITE)
blend((head & (yn > 0.74) & (N[:, 2] > 0.3) & (np.abs(x) > 0.075)).astype(float), PINK)
blend((head & (yn > 0.86)).astype(float) * sm(yn, 0.86, 0.93), DARK)
blend(tail.astype(float) * sm(-0.215 - z, 0, 0.03), WHITE)
blend((~tail).astype(float) * sm(0.085 - yn, 0, 0.04), DARK)
blend((head & (z > 0.28) & (yn > 0.35) & (yn < 0.50)).astype(float), DARK)
for sx in (-1, 1):
    ex, ey = sx * 0.052, 0.60 * 0.481 - 0.233
    d = np.sqrt(((x - ex) / 0.017) ** 2 + ((y - ey) / 0.024) ** 2)
    blend((head & (z > 0.1) & (N[:, 2] > 0.3)).astype(float) * sm(1.25 - d, 0, 0.5), DARK)
vc = np.concatenate([(((col / 255.0) ** 2.2) * 255).round(), np.full((len(V), 1), 255)], 1).astype(np.uint8)
out = trimesh.Trimesh(V, F, vertex_colors=vc, process=False)
out.visual.material = PBRMaterial(metallicFactor=0.0, roughnessFactor=0.85, baseColorFactor=[255, 255, 255, 255])
out.export(dst)
print(len(F), "mặt ->", dst)
