import { useContext, useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { UserContext } from "./context/UserContext";
import { api } from "./lib/api";
import "./App.css";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
function Message({ children }) {
  return children ? (
    <div className="message" role="alert">
      {children}
    </div>
  ) : null;
}
function Status({ status }) {
  return (
    <span className={`status ${status.toLowerCase()}`}>
      <i />
      {status === "Close"
        ? "Closed"
        : status === "Cancel"
          ? "Cancelled"
          : "Open"}
    </span>
  );
}
function Loading() {
  return (
    <div className="empty" role="status">
      Loading your workspace…
    </div>
  );
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon">cs</span>course
      <span className="brand-light">studio</span>
      <span className="brand-dot">.</span>
    </span>
  );
}
function Login() {
  const { login, sessionError } = useContext(UserContext);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await login({ login: form.get("login"), password: form.get("password") });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <Brand />
        <div>
          <p className="eyebrow">A LITTLE CURIOSITY. A LOT OF POSSIBILITY.</p>
          <h1>
            Your next chapter
            <br />
            starts here.
          </h1>
          <p className="story-copy">
            Learn something new. Share what you know.
            <br />A dedicated space for students and teachers to grow.
          </p>
          <div className="art" aria-hidden="true">
            <div className="art-circle" />
            <span className="art-card one">01 / Discover</span>
            <span className="art-card two">02 / Learn</span>
            <span className="art-card three">03 / Grow ↗</span>
          </div>
        </div>
        <span className="story-footer">COURSE STUDIO · ONLINE LEARNING</span>
      </section>
      <section className="login-form">
        <div className="login-inner">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Make room for learning.</h2>
          <p className="muted">Sign in to your course workspace.</p>
          <form onSubmit={submit}>
            <label>
              Username or email
              <input
                name="login"
                autoComplete="username"
                required
                maxLength={254}
                placeholder="e.g. student1"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={72}
                placeholder="Enter your password"
              />
            </label>
            <Message>{error || sessionError}</Message>
            <button className="button primary" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to your workspace →"}
            </button>
          </form>
          <p className="login-help">
            Your account opens the right workspace automatically.
            <br />
            Students discover courses. Teachers create them.
          </p>
        </div>
      </section>
    </div>
  );
}
function Shell() {
  const { user, logout } = useContext(UserContext);
  const [error, setError] = useState("");
  const teacher = user.role === "Teacher";
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link to="/" className="brand-link">
          <Brand />
        </Link>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          <NavLink to="/" end>
            <span>▦</span>
            {teacher ? "My courses" : "Explore courses"}
          </NavLink>
          {!teacher && (
            <NavLink to="/enrolled">
              <span>▤</span>My learning
            </NavLink>
          )}
          {teacher && (
            <NavLink to="/courses/new">
              <span>＋</span>Create a course
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="note">
            <span>Keep moving forward.</span>
            <p>
              {teacher
                ? "Every course is a chance to inspire someone's next step."
                : "Small steps today. New possibilities tomorrow."}
            </p>
          </div>
          <div className="profile">
            <span className="avatar">
              {user.username.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{user.username}</strong>
              <small>{user.role} account</small>
            </div>
          </div>
          <button
            className="signout"
            onClick={async () => {
              try {
                await logout();
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Sign out ↗
          </button>
          <Message>{error}</Message>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>{teacher ? "Teaching workspace" : "Learning workspace"}</span>
          <span className="topbar-right">
            <span className="live-dot" />A good day to{" "}
            {teacher ? "teach" : "learn"}
          </span>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<CourseList key="all" />} />
            <Route
              path="/enrolled"
              element={
                teacher ? (
                  <Navigate to="/" />
                ) : (
                  <CourseList key="enrolled" enrolled />
                )
              }
            />
            <Route
              path="/courses/new"
              element={teacher ? <CourseForm key="new" /> : <Navigate to="/" />}
            />
            <Route
              path="/courses/:id/edit"
              element={teacher ? <CourseForm /> : <Navigate to="/" />}
            />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="page-footer">
          A space to learn. A place to grow.<span>Course Studio © 2026</span>
        </footer>
      </div>
    </div>
  );
}
function CourseList({ enrolled = false }) {
  const { user } = useContext(UserContext);
  const teacher = user.role === "Teacher";
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    api(`/course?q=${encodeURIComponent(query)}&enrolled=${enrolled}`)
      .then((data) => {
        if (active) setCourses(data.courses);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, enrolled, retry]);
  function search(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setQuery(draft.trim());
    setRetry((x) => x + 1);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {teacher
              ? "SHARE YOUR EXPERTISE"
              : enrolled
                ? "YOUR LEARNING JOURNEY"
                : "STAY CURIOUS"}
          </p>
          <h1>
            {teacher
              ? "Your teaching, in one place."
              : enrolled
                ? "A little progress, every day."
                : "What will you learn next?"}
          </h1>
          <p className="muted">
            {teacher
              ? "Create thoughtful courses and help your students move forward."
              : enrolled
                ? "Pick up where you left off. Your next chapter is waiting."
                : "Explore new ideas and build skills with courses from our teachers."}
          </p>
        </div>
        {teacher && (
          <Link to="/courses/new" className="button primary">
            ＋ Create course
          </Link>
        )}
      </div>
      <section className="welcome-strip">
        <div>
          <span className="strip-label">
            {teacher ? "YOUR CLASSROOM, YOUR WAY" : "INVEST IN YOUR CURIOSITY"}
          </span>
          <h2>
            {teacher
              ? "Good teaching opens doors."
              : "Big possibilities start with one course."}
          </h2>
          <p>
            {teacher
              ? "Manage seats, meet your students, and make your next course happen."
              : "Find a topic that sparks your interest. We’ll help you take the next step."}
          </p>
        </div>
        <span className="strip-art" aria-hidden="true">
          ↗
        </span>
      </section>
      <section>
        <div className="catalog-heading">
          <h2>
            {teacher
              ? "My courses"
              : enrolled
                ? "My courses"
                : "Discover courses"}
            <span className="count">{courses.length}</span>
          </h2>
          <form className="search" onSubmit={search}>
            <label className="sr-only" htmlFor="course-search">
              Search by course or teacher
            </label>
            <input
              id="course-search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search course or teacher…"
              maxLength={120}
            />
            <button type="submit" aria-label="Search courses">
              Search
            </button>
          </form>
        </div>
        <Message>{error}</Message>
        {loading ? (
          <Loading />
        ) : error ? (
          <button
            className="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setRetry((x) => x + 1);
            }}
          >
            Try again
          </button>
        ) : courses.length ? (
          <div className="course-grid">
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                teacher={teacher}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>
              {query
                ? "No matching courses"
                : enrolled
                  ? "Your journey starts here"
                  : "No courses yet"}
            </h3>
            <p>
              {query
                ? "Try a different course or teacher name."
                : teacher
                  ? "Create your first course to welcome students."
                  : "Explore available courses and find your next step."}
            </p>
            {enrolled && (
              <Link className="button" to="/">
                Explore courses
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );
}
function CourseCard({ course, index, teacher }) {
  const palette = ["sage", "peach", "lavender"][index % 3];
  return (
    <article className="course-card">
      <div className={`course-cover ${palette}`}>
        <span className="cover-category">{course.topics[0]}</span>
        <span className="cover-shape" aria-hidden="true">
          {["◒", "✳", "◈"][index % 3]}
        </span>
        <Status status={course.status} />
      </div>
      <div className="card-body">
        <p className="teacher-name">WITH {course.teacherName.toUpperCase()}</p>
        <h3>
          <Link to={`/courses/${course.id}`}>{course.name}</Link>
        </h3>
        <div className="topic-list">
          {course.topics.slice(0, 3).map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
          {course.topics.length > 3 && <span>+{course.topics.length - 3}</span>}
        </div>
        <div className="course-meta">
          <span>◷ {course.duration} days</span>
          <span>
            ♧ {course.enrolledCount} / {course.maxStudents} students
          </span>
        </div>
        <div className="capacity">
          <span
            style={{
              width: `${Math.min(100, (course.enrolledCount / course.maxStudents) * 100)}%`,
            }}
          />
        </div>
        <div className="card-footer">
          <strong>{money(course.price)}</strong>
          <Link to={`/courses/${course.id}`}>
            {teacher
              ? "Manage course"
              : course.enrolled
                ? "View your course"
                : "View course"}{" "}
            ↗
          </Link>
        </div>
      </div>
    </article>
  );
}
function CourseDetail() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const teacher = user.role === "Teacher";
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    let active = true;
    api(`/course/${id}`)
      .then((data) => {
        if (active) setCourse(data.course);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function enroll() {
    setBusy(true);
    setError("");
    try {
      await api(`/course/${id}/enroll`, { method: "POST" });
      setNotice("You’re enrolled. Welcome to your next chapter!");
    } catch (e) {
      setError(e.message);
    }
    try {
      const data = await api(`/course/${id}`);
      setCourse(data.course);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api(`/course/${id}`, { method: "DELETE" });
      navigate("/");
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setConfirmDelete(false);
    }
  }
  if (!course)
    return (
      <>
        <Link className="back" to="/">
          ← Back to courses
        </Link>
        {error ? <Message>{error}</Message> : <Loading />}
      </>
    );
  return (
    <>
      <Link className="back" to="/">
        ← Back to courses
      </Link>
      <div className="detail-heading">
        <Status status={course.status} />
        <h1>{course.name}</h1>
        <p className="muted">
          Taught by <strong>{course.teacherName}</strong>
        </p>
      </div>
      <Message>{error}</Message>
      {notice && (
        <div className="success" role="status">
          {notice}
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <p className="eyebrow">ROOM TO GROW</p>
          <h2>What you’ll explore</h2>
          <ul className="topics-detail">
            {course.topics.map((topic, i) => (
              <li key={topic}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {topic}
              </li>
            ))}
          </ul>
          {teacher && (
            <>
              <h2 className="roster-title">
                Enrolled students{" "}
                <span className="count">{course.students?.length || 0}</span>
              </h2>
              {course.students?.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.students.map((s) => (
                        <tr key={s.id}>
                          <td>{s.username}</td>
                          <td>{s.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No students have enrolled yet.</p>
              )}
            </>
          )}
        </section>
        <aside className="panel enrollment-panel">
          <p className="eyebrow">COURSE AT A GLANCE</p>
          <p className="detail-price">{money(course.price)}</p>
          <dl>
            <div>
              <dt>Duration</dt>
              <dd>{course.duration} days</dd>
            </div>
            <div>
              <dt>Students enrolled</dt>
              <dd>
                {course.enrolledCount} / {course.maxStudents}
              </dd>
            </div>
            <div>
              <dt>Available seats</dt>
              <dd>{course.seatsRemaining}</dd>
            </div>
          </dl>
          {teacher ? (
            <>
              <Link className="button primary" to={`/courses/${id}/edit`}>
                Edit course
              </Link>
              <button
                className="button danger"
                disabled={busy || course.enrolledCount > 0}
                onClick={() => setConfirmDelete(true)}
              >
                Delete course
              </button>
              {course.enrolledCount > 0 && (
                <p className="hint">
                  Courses with enrolled students cannot be deleted. You can
                  close or cancel the course instead.
                </p>
              )}
              {confirmDelete && (
                <div className="delete-confirm" role="alert">
                  <p>Delete “{course.name}”? This cannot be undone.</p>
                  <button
                    className="button danger"
                    onClick={remove}
                    disabled={busy}
                  >
                    {busy ? "Deleting…" : "Yes, delete course"}
                  </button>
                  <button
                    className="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy}
                  >
                    Keep course
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                className="button primary"
                disabled={
                  busy ||
                  course.enrolled ||
                  course.status !== "Open" ||
                  course.seatsRemaining <= 0
                }
                onClick={enroll}
              >
                {busy
                  ? "Enrolling…"
                  : course.enrolled
                    ? "✓ You’re enrolled"
                    : course.status !== "Open"
                      ? "Enrollment closed"
                      : course.seatsRemaining <= 0
                        ? "Course full"
                        : "Enroll in this course →"}
              </button>
              <p className="hint">
                {course.enrolled
                  ? "Find this course anytime in My learning."
                  : "Enrollment reserves your seat. No payment is collected by this application."}
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
const blank = {
  name: "",
  duration: 7,
  topics: "",
  price: 0,
  maxStudents: 20,
  status: "Open",
};
function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(id ? null : blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    let active = true;
    api(`/course/${id}`)
      .then(({ course }) => {
        if (active)
          setForm({
            name: course.name,
            duration: course.duration,
            topics: course.topics.join("\n"),
            price: course.price,
            maxStudents: course.maxStudents,
            status: course.status,
          });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api(`/course${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        body: {
          ...form,
          duration: Number(form.duration),
          price: Number(form.price),
          maxStudents: Number(form.maxStudents),
          topics: form.topics
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
      navigate(`/courses/${data.course.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!form) return error ? <Message>{error}</Message> : <Loading />;
  return (
    <>
      <Link className="back" to={id ? `/courses/${id}` : "/"}>
        ← Back
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE AN IMPACT</p>
          <h1>
            {id ? "Refine your course." : "Share something worth learning."}
          </h1>
          <p className="muted">
            A clear plan is the beginning of a great learning experience.
          </p>
        </div>
      </div>
      <form className="panel course-form" onSubmit={save}>
        <label>
          Course name
          <input
            name="name"
            value={form.name}
            onChange={change}
            maxLength={120}
            required
            placeholder="Give your course a memorable name"
          />
        </label>
        <label>
          Topics <span className="hint">One topic per line</span>
          <textarea
            name="topics"
            value={form.topics}
            onChange={change}
            rows={5}
            required
            placeholder="Introduction to the topic
Core concepts
Hands-on project"
          />
        </label>
        <div className="form-row">
          <label>
            Duration (days)
            <input
              name="duration"
              type="number"
              min="1"
              max="3650"
              step="1"
              required
              value={form.duration}
              onChange={change}
            />
          </label>
          <label>
            Price (USD)
            <input
              name="price"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              required
              value={form.price}
              onChange={change}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Maximum students
            <input
              name="maxStudents"
              type="number"
              min="1"
              max="10000"
              step="1"
              required
              value={form.maxStudents}
              onChange={change}
            />
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={change}>
              <option value="Open">Open — accepting enrollments</option>
              <option value="Close">Close — visible, enrollment closed</option>
              <option value="Cancel">Cancel — hidden from students</option>
            </select>
          </label>
        </div>
        <p className="hint">
          Open courses accept students while seats remain. Closing keeps the
          course visible. Cancelling hides it from student lists.
        </p>
        <Message>{error}</Message>
        <div className="form-actions">
          <Link className="button" to={id ? `/courses/${id}` : "/"}>
            Cancel
          </Link>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : id ? "Save changes" : "Create course →"}
          </button>
        </div>
      </form>
    </>
  );
}
export default function App() {
  const { user, loading } = useContext(UserContext);
  return (
    <HashRouter>
      {loading ? <Loading /> : user ? <Shell /> : <Login />}
    </HashRouter>
  );
}
