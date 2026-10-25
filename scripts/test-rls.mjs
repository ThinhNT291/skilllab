// Kiểm tra phân quyền (RLS) của các migration bằng Postgres chạy trong bộ nhớ.
// Chạy: npm i --no-save @electric-sql/pglite && node scripts/test-rls.mjs
// Giả lập auth.uid() và vai trò authenticated của Supabase; không cần kết nối mạng hay khóa nào.
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
const db = new PGlite()
const dir = new URL("../supabase/migrations/", import.meta.url).pathname
await db.exec(`
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
  create role authenticated nologin;
  grant usage on schema public, auth to authenticated;
  alter default privileges in schema public grant all on tables to authenticated;
  alter default privileges in schema public grant all on sequences to authenticated;
`)
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
  try { await db.exec(fs.readFileSync(dir + f, "utf8")); console.log("ok ", f) } catch (e) { console.log("ERR", f, e.message); process.exit(1) }
}
// chạy lại lần 2 để kiểm tính idempotent
await db.exec(fs.readFileSync(dir + "0007_roles_classes.sql", "utf8")); console.log("ok  0007 lần 2")

const U = { s1: "00000000-0000-0000-0000-0000000000a1", s2: "00000000-0000-0000-0000-0000000000a2", t1: "00000000-0000-0000-0000-0000000000b1", t2: "00000000-0000-0000-0000-0000000000b2", ad: "00000000-0000-0000-0000-0000000000c1" }
const P = {}
for (const [k, u] of Object.entries(U)) {
  const role = k.startsWith("s") ? "student" : k.startsWith("t") ? "teacher" : "admin"
  const r = await db.query(`insert into profiles (auth_user_id, role, nickname) values ($1,$2,$3) returning id`, [u, role, k])
  P[k] = r.rows[0].id
}
const cls = (await db.query(`insert into classes (name) values ('Lớp 6A') returning id`)).rows[0].id
await db.query(`insert into class_teachers values ($1,$2)`, [cls, P.t1])
await db.query(`insert into class_members values ($1,$2)`, [cls, P.s1])
for (const k of ["s1", "s2"]) await db.query(`insert into answers (profile_id, exercise_id, topic, correct) values ($1,'x','t',true)`, [P[k]])
await db.query(`insert into graded_attempts (profile_id, skill, task_id, target_bac, total, estimated_bac, scores) values ($1,'writing','t',2,6,2,'{}')`, [P.s1])

async function as(k, sql, params = []) {
  await db.exec(`set app.uid = '${U[k]}'; set role authenticated;`)
  try { return (await db.query(sql, params)).rows } catch (e) { return "ERR:" + e.message.slice(0, 60) } finally { await db.exec(`reset role;`) }
}
const count = async (k, t) => (await as(k, `select count(*)::int c from ${t}`))[0].c
const check = (name, got, want) => { console.log(got === want ? "PASS" : "FAIL", name, "→", got, "(mong", want + ")"); if (got !== want) process.exitCode = 1 }

check("s1 thấy answers của mình", await count("s1", "answers"), 1)
check("s2 thấy answers của mình (không thấy s1)", await count("s2", "answers"), 1)
check("t1 (dạy lớp có s1) thấy answers: s1 thôi", await count("t1", "answers"), 1)
check("t2 (không dạy lớp nào) không thấy gì", await count("t2", "answers"), 0)
check("admin thấy cả 2", await count("ad", "answers"), 2)
check("t1 thấy graded_attempts của s1", await count("t1", "graded_attempts"), 1)
check("t2 không thấy graded_attempts", await count("t2", "graded_attempts"), 0)
check("t1 thấy profiles: mình + s1", await count("t1", "profiles"), 2)
check("s1 chỉ thấy profile mình", await count("s1", "profiles"), 1)
check("admin thấy 5 profile", await count("ad", "profiles"), 5)
check("s1 thấy lớp mình học", await count("s1", "classes"), 1)
check("s2 không thấy lớp", await count("s2", "classes"), 0)
check("t1 thấy thành viên lớp", await count("t1", "class_members"), 1)
check("s2 không thấy thành viên", await count("s2", "class_members"), 0)
const ins = await as("t1", `insert into answers (profile_id, exercise_id, topic, correct) values ($1,'y','t',true)`, [P.s1])
check("t1 không ghi answers thay s1", typeof ins === "string", true)
const mk = await as("t1", `insert into classes (name) values ('lậu')`)
check("giáo viên không tạo lớp", typeof mk === "string", true)
const mk2 = await as("ad", `insert into classes (name) values ('Lớp 6B') returning id`)
check("admin tạo lớp được", Array.isArray(mk2), true)
const esc = await as("s1", `update profiles set role='admin' where auth_user_id = $1`, [U.s1])
const role = (await db.query(`select role from profiles where id=$1`, [P.s1])).rows[0].role
check("học sinh không tự nâng quyền", role, "student")
const aud = await as("s1", `insert into audit_log (action) values ('x')`)
check("học sinh không ghi audit_log", typeof aud === "string", true)
check("giáo viên không đọc audit_log", await count("t1", "audit_log"), 0)
const bad = await as("ad", `update profiles set username='AB' where id=$1`, [P.s1])
check("username sai định dạng bị từ chối (admin cũng không có quyền cột, nên lỗi)", typeof bad === "string", true)
await db.query(`update profiles set username='hs.minh01' where id=$1`, [P.s1]); 
const dup = await db.query(`update profiles set username='hs.minh01' where id=$1`, [P.s2]).catch((e) => "ERR")
check("username trùng bị từ chối", dup === "ERR", true)
