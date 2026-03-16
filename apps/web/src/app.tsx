import type { Category, PostSummary } from "@donggeuri/shared";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useParams,
} from "react-router-dom";

import { getPost, listCategories, listPosts } from "./lib/api";

function ShellCard(props: { title: string; description: string; children?: ReactNode }) {
  return (
    <section className="shell-card">
      <div className="shell-card__header">
        <p className="eyebrow">Cloudflare scaffold</p>
        <h2>{props.title}</h2>
      </div>
      <p className="shell-copy">{props.description}</p>
      {props.children}
    </section>
  );
}

function PublicLayout() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <div className="page-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Pages + Workers + D1 + R2</p>
          <h1>Donggeuri Blog Platform</h1>
        </div>
        <nav className="nav-row">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/search">Search</Link>
          <Link to="/dashboard">Admin</Link>
        </nav>
      </header>

      <main className="content-grid">
        <Outlet />

        <aside className="sidebar">
          <ShellCard title="Categories" description="Loaded from /api/public/categories.">
            <ul className="token-list">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link to={`/category/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
              {categories.length === 0 ? <li>No categories yet.</li> : null}
            </ul>
          </ShellCard>
        </aside>
      </main>
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="page-shell page-shell--admin">
      <header className="masthead masthead--admin">
        <div>
          <p className="eyebrow">Admin UI scaffold</p>
          <h1>Content Operations</h1>
        </div>
        <nav className="nav-row">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/posts">Posts</Link>
          <Link to="/media">Media</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/tags">Tags</Link>
        </nav>
      </header>

      <main className="admin-grid">
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listPosts()
      .then((items) => {
        setPosts(items);
        setError(null);
      })
      .catch((reason: Error) => {
        setPosts([]);
        setError(reason.message);
      });
  }, []);

  return (
    <div className="main-column">
      <ShellCard
        title="Public blog homepage"
        description="This route is scaffolded for Cloudflare Pages and calls the public Worker API."
      >
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.id}>
              <Link to={`/post/${post.slug}`}>{post.title}</Link>
              <span>{post.status}</span>
            </li>
          ))}
          {!posts.length && !error ? <li>No published posts found yet.</li> : null}
          {error ? <li>{error}</li> : null}
        </ul>
      </ShellCard>

      <ShellCard
        title="Mapped public routes"
        description="The scaffold mirrors the MVP paths listed in docs/public_web_pages.md."
      >
        <div className="route-grid">
          {["/", "/category/:slug", "/tag/:slug", "/post/:slug", "/about", "/search", "/rss.xml", "/sitemap.xml"].map(
            (route) => (
              <code key={route}>{route}</code>
            ),
          )}
        </div>
      </ShellCard>
    </div>
  );
}

function PostPage() {
  const { slug = "" } = useParams();
  const [title, setTitle] = useState("Loading post...");
  const [content, setContent] = useState("The post detail page will render content_json from D1.");

  useEffect(() => {
    void getPost(slug)
      .then((post) => {
        setTitle(post.title);
        setContent(post.content || "No content available.");
      })
      .catch(() => {
        setTitle("Post not found");
        setContent("The public Worker API returned no published post for this slug.");
      });
  }, [slug]);

  return (
    <div className="main-column">
      <ShellCard title={title} description={`Public post route for slug "${slug}".`}>
        <pre className="content-block">{content}</pre>
      </ShellCard>
    </div>
  );
}

function PlaceholderPage(props: {
  title: string;
  description: string;
  routeLabel: string;
  details?: string[];
}) {
  return (
    <div className="main-column">
      <ShellCard title={props.title} description={props.description}>
        <p className="route-badge">{props.routeLabel}</p>
        {props.details?.length ? (
          <ul className="token-list">
            {props.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </ShellCard>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "category/:slug",
        element: (
          <PlaceholderPage
            title="Category archive"
            description="Scaffold target for category landing pages."
            routeLabel="/category/:slug"
          />
        ),
      },
      {
        path: "tag/:slug",
        element: (
          <PlaceholderPage
            title="Tag archive"
            description="Scaffold target for tag landing pages."
            routeLabel="/tag/:slug"
          />
        ),
      },
      { path: "post/:slug", element: <PostPage /> },
      {
        path: "about",
        element: (
          <PlaceholderPage
            title="About"
            description="Reserved for the profile or platform story page."
            routeLabel="/about"
          />
        ),
      },
      {
        path: "search",
        element: (
          <PlaceholderPage
            title="Search"
            description="Reserved for full-text search and result filtering."
            routeLabel="/search"
          />
        ),
      },
      {
        path: "rss.xml",
        element: (
          <PlaceholderPage
            title="RSS feed"
            description="This route will later emit XML from published post data."
            routeLabel="/rss.xml"
          />
        ),
      },
      {
        path: "sitemap.xml",
        element: (
          <PlaceholderPage
            title="Sitemap"
            description="This route will later emit XML for Cloudflare Pages crawlers."
            routeLabel="/sitemap.xml"
          />
        ),
      },
    ],
  },
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      {
        path: "login",
        element: (
          <PlaceholderPage
            title="Admin login"
            description="Reserved for credential and JWT session bootstrap."
            routeLabel="/login"
            details={["Connect to Worker auth flow", "Persist JWT in secure storage"]}
          />
        ),
      },
      {
        path: "dashboard",
        element: (
          <PlaceholderPage
            title="Dashboard"
            description="Reserved for post status summaries and quick actions."
            routeLabel="/dashboard"
            details={["Draft counts", "Recent posts", "Media usage snapshots"]}
          />
        ),
      },
      {
        path: "posts",
        element: (
          <PlaceholderPage
            title="Posts"
            description="Reserved for the post list and moderation controls."
            routeLabel="/posts"
            details={["Backed by /api/admin/posts routes", "Draft and published filters"]}
          />
        ),
      },
      {
        path: "posts/new",
        element: (
          <PlaceholderPage
            title="Create post"
            description="Reserved for the editor screen."
            routeLabel="/posts/new"
          />
        ),
      },
      {
        path: "posts/:id/edit",
        element: (
          <PlaceholderPage
            title="Edit post"
            description="Reserved for updating an existing post."
            routeLabel="/posts/:id/edit"
          />
        ),
      },
      {
        path: "media",
        element: (
          <PlaceholderPage
            title="Media library"
            description="Reserved for R2-backed media browsing and uploads."
            routeLabel="/media"
            details={["R2 object browser", "Alt text management", "Asset reuse"]}
          />
        ),
      },
      {
        path: "categories",
        element: (
          <PlaceholderPage
            title="Categories"
            description="Reserved for category CRUD and taxonomy management."
            routeLabel="/categories"
          />
        ),
      },
      {
        path: "tags",
        element: (
          <PlaceholderPage
            title="Tags"
            description="Reserved for tag CRUD and taxonomy management."
            routeLabel="/tags"
          />
        ),
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
