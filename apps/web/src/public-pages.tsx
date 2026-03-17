import type { Category, CategoryFeed, Post, PostSummary, TagFeed } from "@cloudflare-blog/shared";
import { ArrowUpRight, MoveRight } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useParams, useSearchParams } from "react-router-dom";

import { AnalyticsTracker } from "./components/analytics-tracker";
import { extractTocHeadings, MarkdownContent } from "./components/markdown-content";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  getCategoryFeed,
  getPost,
  getTagFeed,
  getWorkerResourceUrl,
  listCategories,
  listPosts,
  searchPosts,
} from "./lib/api";
import {
  buildExcerpt,
  createBlogPostingStructuredData,
  createCollectionPageStructuredData,
  createWebPageStructuredData,
  createWebSiteStructuredData,
  type PageMetadataInput,
  useSeoMetadata,
} from "./lib/seo";
import { cn } from "./lib/utils";
import { ErrorMessage } from "./ui";

const RSS_FEED_URL = "/rss.xml";
const SITEMAP_URL = "/sitemap.xml";
const SITE_TITLE = "Cloudflare Blog";
const SITE_ALT_NAME = "Cloudflare Blog Template";
const SITE_AUTHOR = "Blog Author";
const SITE_TAGLINE = "차분한 글, 가벼운 메모, 오래 남길 자료를 함께 쌓는 공개 블로그 템플릿입니다.";
const SITE_DESCRIPTION = "Cloudflare Pages, Workers, D1, R2를 바탕으로 만든 재사용 가능한 공개 블로그 템플릿입니다.";
const ABOUT_DESCRIPTION =
  "Cloudflare Blog는 공개 웹, 관리자 앱, API를 분리해 운영할 수 있게 만든 재사용용 블로그 템플릿입니다.";
const DEFAULT_OG_IMAGE_PATH = "/og-default.svg";

const publicLinks = [
  { href: "/", label: "홈", external: false },
  { href: "/about", label: "소개", external: false },
  { href: "/search", label: "검색", external: false },
];

const pageDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const ARCHIVE_GROUPS = [
  {
    eyebrow: "Articles",
    title: "긴 글과 메인 아티클을 정리합니다.",
    description:
      "대표 글, 에세이, 깊이 있는 해설처럼 홈에서 먼저 보여주고 싶은 긴 글을 모아두는 갈래입니다.",
    items: ["대표 글", "긴 글", "에세이"],
  },
  {
    eyebrow: "Guides",
    title: "가이드와 how-to를 단계별로 정리합니다.",
    description:
      "사용법, 설정법, 작업 절차처럼 다시 참고하기 쉬운 형태의 글을 모아두는 갈래입니다.",
    items: ["시작 가이드", "설정 방법", "운영 문서"],
  },
  {
    eyebrow: "Reviews",
    title: "도구와 콘텐츠 리뷰를 차분히 남깁니다.",
    description:
      "제품, 서비스, 책, 영상, 툴처럼 경험을 남기고 비교하기 좋은 주제를 모아두는 갈래입니다.",
    items: ["도구 리뷰", "콘텐츠 리뷰", "비교 기록"],
  },
  {
    eyebrow: "Notes",
    title: "짧은 메모와 관찰 기록을 이어 둡니다.",
    description:
      "짧은 생각, 작업 로그, 발췌 메모처럼 빠르게 쌓이고 자주 돌아보기 좋은 내용을 정리하는 갈래입니다.",
    items: ["짧은 메모", "작업 로그", "아이디어 스냅샷"],
  },
  {
    eyebrow: "Resources",
    title: "링크와 자료를 다시 찾기 좋게 모읍니다.",
    description:
      "레퍼런스, 링크 모음, 아카이브형 문서를 한눈에 정리해두는 갈래입니다.",
    items: ["참고 링크", "모음집", "아카이브"],
  },
] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "날짜 미정";
  }

  return pageDateFormatter.format(new Date(value));
}

function estimateReadMinutes(content: string) {
  const words = content
    .replace(/[#>*_`~[\]()!-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

function parseYoutubeVideo(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    let id = "";

    if (hostname === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v") ?? "";
      } else if (url.pathname.startsWith("/embed/")) {
        id = url.pathname.split("/").at(-1) ?? "";
      } else if (url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/").at(-1) ?? "";
      }
    }

    return id || null;
  } catch {
    return null;
  }
}

function buildCategoryTree(categories: Category[]) {
  const items = [...categories].sort((left, right) => left.name.localeCompare(right.name, "ko"));
  const byId = new Map(items.map((category) => [category.id, category]));
  const children = new Map<string, Category[]>();
  const roots: Category[] = [];

  items.forEach((category) => {
    if (category.parentId && byId.has(category.parentId)) {
      children.set(category.parentId, [...(children.get(category.parentId) ?? []), category]);
      return;
    }

    roots.push(category);
  });

  return roots.map((category) => ({
    category,
    children: (children.get(category.id) ?? []).sort((left, right) => left.name.localeCompare(right.name, "ko")),
  }));
}

function usePageMetadata(metadata: PageMetadataInput) {
  useSeoMetadata(metadata);
}

function NavigationLink(props: { href: string; label: string; external?: boolean }) {
  const location = useLocation();
  const isActive =
    !props.external && (props.href === "/" ? location.pathname === "/" : location.pathname.startsWith(props.href));

  if (props.external) {
    return (
      <a href={props.href} className="simple-nav-link">
        {props.label}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <Link to={props.href} className={cn("simple-nav-link", isActive && "simple-nav-link-active")}>
      {props.label}
    </Link>
  );
}

function CategoryChip(props: { category?: Category | null; fallback?: string }) {
  return <span className="simple-chip">{props.category?.name ?? props.fallback ?? "미분류"}</span>;
}

function ArchiveGroupCard(props: (typeof ARCHIVE_GROUPS)[number]) {
  return (
    <article className="topic-card">
      <p className="sidebar-box__eyebrow">{props.eyebrow}</p>
      <h3 className="topic-card__title">{props.title}</h3>
      <p className="topic-card__text">{props.description}</p>
      <div className="topic-card__tags">
        {props.items.map((item) => (
          <span key={item} className="simple-chip">
            {item}
          </span>
        ))}
      </div>
    </article>
  );
}

function PostListItem(props: { post: PostSummary }) {
  return (
    <article className="post-row">
      <div className="post-row__body">
        <div className="post-row__meta">
          <CategoryChip category={props.post.category} />
          <span>{formatDate(props.post.publishedAt ?? props.post.updatedAt)}</span>
        </div>
        <Link to={`/post/${props.post.slug}`} className="post-row__title">
          {props.post.title}
        </Link>
        <p className="post-row__summary">{props.post.excerpt || props.post.subtitle || props.post.slug}</p>
        <Link to={`/post/${props.post.slug}`} className="simple-inline-link">
          자세히 보기
          <MoveRight className="h-4 w-4" />
        </Link>
      </div>
      {props.post.coverImage ? (
        <Link to={`/post/${props.post.slug}`} className="post-row__thumb">
          <img src={props.post.coverImage} alt={props.post.title} />
        </Link>
      ) : null}
    </article>
  );
}

function SidebarCategoryTree(props: { categories: Category[] }) {
  const tree = useMemo(() => buildCategoryTree(props.categories), [props.categories]);

  if (!tree.length) {
    return (
      <div className="sidebar-tree">
        {ARCHIVE_GROUPS.map((group) => (
          <div key={group.eyebrow} className="sidebar-tree__branch">
            <div className="sidebar-tree__parent sidebar-tree__parent-static">{group.eyebrow}</div>
            <div className="sidebar-tree__children">
              {group.items.map((item) => (
                <div key={item} className="sidebar-tree__child sidebar-tree__child-static">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="sidebar-tree">
      {tree.map((node) => (
        <div key={node.category.id} className="sidebar-tree__branch">
          <Link to={`/category/${node.category.slug}`} className="sidebar-tree__parent">
            <span>{node.category.name}</span>
            <MoveRight className="h-4 w-4" />
          </Link>
          {node.children.length ? (
            <div className="sidebar-tree__children">
              {node.children.map((child) => (
                <Link key={child.id} to={`/category/${child.slug}`} className="sidebar-tree__child">
                  <span>{child.name}</span>
                  <MoveRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Sidebar(props: { categories: Category[] }) {
  return (
    <aside className="simple-sidebar">
      <section className="sidebar-box">
        <p className="sidebar-box__eyebrow">{SITE_TITLE}</p>
        <h2 className="sidebar-box__title">가볍게 읽는 글부터 오래 참고할 자료까지 차분히 쌓아가는 기본 블로그입니다.</h2>
        <p className="sidebar-box__text">
          이 영역은 private repo에서 자기 소개나 운영 원칙으로 바꿔 쓰면 좋습니다. 템플릿에서는 메인 글, 카테고리, 피드 동선이 어떻게 보이는지에 집중합니다.
        </p>
      </section>

      <section className="sidebar-box">
        <p className="sidebar-box__eyebrow">기록의 갈래</p>
        <SidebarCategoryTree categories={props.categories} />
      </section>

      <section className="sidebar-box">
        <p className="sidebar-box__eyebrow">피드</p>
        <div className="sidebar-link-list">
          <a href={RSS_FEED_URL} className="sidebar-link-row">
            <span>RSS 피드</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a href={SITEMAP_URL} className="sidebar-link-row">
            <span>사이트맵 XML</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </aside>
  );
}

function ArchiveHeader(props: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="archive-header">
      <p className="archive-header__eyebrow">{props.eyebrow}</p>
      <h1 className="archive-header__title">{props.title}</h1>
      <p className="archive-header__description">{props.description}</p>
    </header>
  );
}

function BreadcrumbTrail(props: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumb-trail" aria-label="breadcrumb">
      {props.items.map((item, index) => {
        const key = `${item.label}-${index}`;
        const isLast = index === props.items.length - 1;

        return (
          <span key={key} className="breadcrumb-trail__item">
            {item.href && !isLast ? (
              <Link to={item.href} className="breadcrumb-trail__link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-trail__current">{item.label}</span>
            )}
            {!isLast ? <span className="breadcrumb-trail__divider">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}

function VideoEmbed(props: { title: string; youtubeUrl: string }) {
  const videoId = parseYoutubeVideo(props.youtubeUrl);

  if (!videoId) {
    return null;
  }

  return (
    <section className="video-box">
      <p className="sidebar-box__eyebrow">관련 영상</p>
      <div className="video-box__frame">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`${props.title} video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}

function TableOfContents(props: { content: string; activeHeading: string }) {
  const headings = useMemo(() => extractTocHeadings(props.content), [props.content]);

  if (!headings.length) {
    return null;
  }

  return (
    <aside className="article-toc">
      <p className="sidebar-box__eyebrow">목차</p>
      <nav className="article-toc__list">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "article-toc__link",
              heading.level === 3 && "article-toc__link-sub",
              props.activeHeading === heading.id && "article-toc__link-active",
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export function PublicLayout() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <div className="simple-shell">
      <AnalyticsTracker />
      <header className="simple-header">
        <div className="simple-header__brand">
          <Link to="/" className="simple-brand">
            {SITE_TITLE}
          </Link>
          <p className="simple-brand__description">{SITE_TAGLINE}</p>
        </div>
        <nav className="simple-nav">
          {publicLinks.map((item) => (
            <NavigationLink key={item.href} href={item.href} label={item.label} external={item.external} />
          ))}
        </nav>
      </header>

      <main className="simple-grid">
        <div className="simple-main">
          <Outlet />
        </div>
        <Sidebar categories={categories} />
      </main>
    </div>
  );
}

export function HomePage() {
  usePageMetadata({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
    image: DEFAULT_OG_IMAGE_PATH,
    structuredData: createWebSiteStructuredData({
      name: SITE_TITLE,
      alternateName: SITE_ALT_NAME,
      description: SITE_DESCRIPTION,
      path: "/",
    }),
  });

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listPosts()
      .then((items) => {
        setPosts(items);
        setError(null);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div className="simple-page">
      <ErrorMessage message={error} />

      <ArchiveHeader
        eyebrow="블로그"
        title="읽기 흐름과 콘텐츠 구조를 바로 확인할 수 있는 기본 공개 블로그"
        description="최신 글, 카테고리, 검색, RSS와 sitemap까지 기본 동선을 갖춘 템플릿입니다. 실제 운영 카피와 주제는 private repo에서 교체하면 됩니다."
      />

      {featured ? (
        <article className="featured-post">
          <div className="featured-post__body">
            <div className="post-row__meta">
              <CategoryChip category={featured.category} fallback="최신 글" />
              <span>{formatDate(featured.publishedAt ?? featured.updatedAt)}</span>
            </div>
            <Link to={`/post/${featured.slug}`} className="featured-post__title">
              {featured.title}
            </Link>
            <p className="featured-post__summary">
              {featured.excerpt || featured.subtitle || "가장 최근에 올라온 글을 먼저 읽기 좋은 위치에 두었습니다."}
            </p>
            <Button asChild className="simple-primary-button">
              <Link to={`/post/${featured.slug}`}>
                글 읽기
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {featured.coverImage ? (
            <Link to={`/post/${featured.slug}`} className="featured-post__media">
              <img src={featured.coverImage} alt={featured.title} />
            </Link>
          ) : null}
        </article>
      ) : (
        <div className="empty-box">아직 공개된 글이 없습니다. 관리자에서 첫 글을 작성하면 이곳에 가장 먼저 보입니다.</div>
      )}

      <section className="list-section">
        <div className="list-section__header">
          <h2>최신 글 목록</h2>
          <p>최근에 올라온 글을 위에서 아래로 차례로 읽을 수 있게 정리했습니다.</p>
        </div>
        {rest.length ? (
          <div className="post-list">
            {rest.map((post) => (
              <PostListItem key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="empty-box">첫 글 뒤에 이어지는 목록은 새 글이 쌓이면서 자연스럽게 채워집니다.</div>
        )}
      </section>
    </div>
  );
}

export function PostPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<PostSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeHeading, setActiveHeading] = useState("");
  const [progress, setProgress] = useState(0);
  const postPath = `/post/${slug}`;
  const postDescription = post?.excerpt ?? post?.subtitle ?? (post ? buildExcerpt(post.content) : SITE_DESCRIPTION);
  const postBreadcrumbs = [
    { name: SITE_TITLE, path: "/" },
    ...(post?.category?.slug && post?.category?.name
      ? [{ name: post.category.name, path: `/category/${post.category.slug}` }]
      : []),
    { name: post?.title ?? "글", path: postPath },
  ];

  usePageMetadata({
    title: post ? `${post.title} | ${SITE_TITLE}` : `글 불러오는 중 | ${SITE_TITLE}`,
    description: postDescription,
    path: postPath,
    robots: error ? "noindex,follow" : "index,follow",
    ogType: post ? "article" : "website",
    image: post?.coverImage ?? DEFAULT_OG_IMAGE_PATH,
    structuredData: post
      ? createBlogPostingStructuredData({
          title: post.title,
          description: postDescription,
          path: postPath,
          image: post.coverImage ?? DEFAULT_OG_IMAGE_PATH,
          publishedAt: post.publishedAt ?? post.createdAt,
          updatedAt: post.updatedAt,
          categoryName: post.category?.name,
          tags: post.tags.map((tag) => tag.name),
          breadcrumbs: postBreadcrumbs,
          authorName: SITE_AUTHOR,
        })
      : createWebPageStructuredData({
          name: `글 불러오는 중 | ${SITE_TITLE}`,
          description: SITE_DESCRIPTION,
          path: postPath,
          breadcrumbs: postBreadcrumbs,
        }),
  });

  useEffect(() => {
    void getPost(slug)
      .then((item) => {
        setPost(item);
        setError(null);
      })
      .catch((reason: Error) => {
        setPost(null);
        setError(reason.message);
      });
  }, [slug]);

  useEffect(() => {
    if (!post?.category?.slug) {
      setRelatedPosts([]);
      return;
    }

    void getCategoryFeed(post.category.slug)
      .then((value) => {
        setRelatedPosts(value.posts.filter((item) => item.slug !== post.slug).slice(0, 3));
      })
      .catch(() => setRelatedPosts([]));
  }, [post?.category?.slug, post?.slug]);

  useEffect(() => {
    if (!post) {
      return;
    }

    const headings = extractTocHeadings(post.content);

    const updateReadingState = () => {
      const documentElement = document.documentElement;
      const maxScroll = documentElement.scrollHeight - documentElement.clientHeight;
      const nextProgress = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
      setProgress(nextProgress);

      if (!headings.length) {
        setActiveHeading("");
        return;
      }

      let current = headings[0]?.id ?? "";

      for (const heading of headings) {
        const element = document.getElementById(heading.id);

        if (element && element.getBoundingClientRect().top <= 120) {
          current = heading.id;
        }
      }

      setActiveHeading(current);
    };

    updateReadingState();
    window.addEventListener("scroll", updateReadingState, { passive: true });
    window.addEventListener("resize", updateReadingState);

    return () => {
      window.removeEventListener("scroll", updateReadingState);
      window.removeEventListener("resize", updateReadingState);
    };
  }, [post]);

  return (
    <div className="simple-page">
      <ErrorMessage message={error} />
      <div className="simple-reading-progress" aria-hidden="true">
        <span className="simple-reading-progress__bar" style={{ width: `${progress}%` }} />
      </div>

      <article className="article-page">
        <header className="article-page__header">
          <BreadcrumbTrail
            items={[
              { label: SITE_TITLE, href: "/" },
              ...(post?.category?.slug && post?.category?.name
                ? [{ label: post.category.name, href: `/category/${post.category.slug}` }]
                : []),
              { label: post?.title ?? "글" },
            ]}
          />
          <div className="post-row__meta">
            {post?.category ? <CategoryChip category={post.category} /> : null}
            {post?.publishedAt ? <span>발행 {formatDate(post.publishedAt)}</span> : null}
            <span>수정 {formatDate(post?.updatedAt ?? post?.createdAt)}</span>
            <span>{post ? `${estimateReadMinutes(post.content)}분 읽기` : ""}</span>
          </div>
          <h1>{post?.title ?? "글 불러오는 중"}</h1>
          {post?.subtitle || post?.excerpt ? (
            <p className="article-page__summary">{post.excerpt || post.subtitle}</p>
          ) : null}
          <div className="article-page__actions">
            <Link to="/" className="simple-inline-link">
              목록으로 돌아가기
            </Link>
            {post?.tags.length ? (
              <div className="article-tags">
                {post.tags.map((tag) => (
                  <Link key={tag.id} to={`/tag/${tag.slug}`} className="simple-chip">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        {post?.coverImage ? (
          <div className="article-cover">
            <img src={post.coverImage} alt={post.title} />
          </div>
        ) : null}

        {post?.youtubeUrl ? <VideoEmbed title={post.title} youtubeUrl={post.youtubeUrl} /> : null}

        <div className="article-layout">
          <div className="article-content-wrap">
            {post ? <MarkdownContent content={post.content} /> : <div className="empty-box">요청한 글을 불러오지 못했습니다.</div>}
          </div>
          {post ? <TableOfContents content={post.content} activeHeading={activeHeading} /> : null}
        </div>

        {relatedPosts.length ? (
          <section className="list-section article-related">
            <div className="list-section__header">
              <h2>{post?.category?.name ? `${post.category.name}에서 더 읽기` : "함께 읽기 좋은 글"}</h2>
              <p>같은 기록의 갈래에서 이어 읽기 좋은 글을 함께 둡니다.</p>
            </div>
            <div className="post-list">
              {relatedPosts.map((item) => (
                <PostListItem key={item.id} post={item} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}

export function CategoryArchivePage() {
  const { slug = "" } = useParams();
  const [feed, setFeed] = useState<CategoryFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const categoryPath = `/category/${slug}`;
  const categoryDescription = feed?.category.description ?? "선택한 기록의 갈래에 속한 공개 글을 모아둔 페이지입니다.";

  usePageMetadata({
    title: feed ? `${feed.category.name} | ${SITE_TITLE}` : `기록의 갈래 | ${SITE_TITLE}`,
    description: categoryDescription,
    path: categoryPath,
    image: DEFAULT_OG_IMAGE_PATH,
    structuredData: createCollectionPageStructuredData({
      name: feed ? `${feed.category.name} | ${SITE_TITLE}` : `기록의 갈래 | ${SITE_TITLE}`,
      description: categoryDescription,
      path: categoryPath,
      breadcrumbs: [
        { name: SITE_TITLE, path: "/" },
        { name: feed?.category.name ?? "기록의 갈래", path: categoryPath },
      ],
    }),
  });

  useEffect(() => {
    void getCategoryFeed(slug)
      .then((value) => {
        setFeed(value);
        setError(null);
      })
      .catch((reason: Error) => {
        setFeed(null);
        setError(reason.message);
      });
  }, [slug]);

  return (
    <div className="simple-page">
      <ErrorMessage message={error} />
      <BreadcrumbTrail
        items={[
          { label: SITE_TITLE, href: "/" },
          { label: feed?.category.name ?? "기록의 갈래" },
        ]}
      />
      <ArchiveHeader
        eyebrow="기록의 갈래"
        title={feed?.category.name ?? "기록의 갈래"}
        description={feed?.category.description ?? "선택한 갈래에 속한 글을 한곳에 모아둔 목록입니다."}
      />
      {feed?.posts.length ? (
        <div className="post-list">
          {feed.posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-box">이 갈래에는 아직 공개된 글이 없습니다.</div>
      )}
    </div>
  );
}

export function TagArchivePage() {
  const { slug = "" } = useParams();
  const [feed, setFeed] = useState<TagFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tagPath = `/tag/${slug}`;
  const tagTitle = feed ? `#${feed.tag.name} | ${SITE_TITLE}` : `태그 | ${SITE_TITLE}`;
  const tagDescription = feed ? `#${feed.tag.name}로 묶인 공개 글 목록입니다.` : "선택한 태그에 연결된 공개 글을 모아보는 페이지입니다.";

  usePageMetadata({
    title: tagTitle,
    description: tagDescription,
    path: tagPath,
    robots: "noindex,follow",
    image: DEFAULT_OG_IMAGE_PATH,
    structuredData: createWebPageStructuredData({
      name: tagTitle,
      description: tagDescription,
      path: tagPath,
      breadcrumbs: [
        { name: SITE_TITLE, path: "/" },
        { name: feed ? `#${feed.tag.name}` : "태그", path: tagPath },
      ],
    }),
  });

  useEffect(() => {
    void getTagFeed(slug)
      .then((value) => {
        setFeed(value);
        setError(null);
      })
      .catch((reason: Error) => {
        setFeed(null);
        setError(reason.message);
      });
  }, [slug]);

  return (
    <div className="simple-page">
      <ErrorMessage message={error} />
      <ArchiveHeader
        eyebrow="태그"
        title={feed ? `#${feed.tag.name}` : "태그"}
        description={feed ? `#${feed.tag.name}로 묶인 글 목록입니다.` : "선택한 태그에 연결된 글을 모아보는 페이지입니다."}
      />
      {feed?.posts.length ? (
        <div className="post-list">
          {feed.posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-box">이 태그에는 아직 공개된 글이 없습니다.</div>
      )}
    </div>
  );
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentQuery = searchParams.get("q")?.trim() ?? "";
  const [draft, setDraft] = useState(currentQuery);
  const [results, setResults] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMetadata({
    title: currentQuery ? `"${currentQuery}" 검색 | ${SITE_TITLE}` : `검색 | ${SITE_TITLE}`,
    description: "주제어 하나로 공개 글의 제목, 요약, 본문, 태그를 다시 찾을 수 있는 검색 페이지입니다.",
    path: "/search",
    robots: "noindex,follow",
    image: DEFAULT_OG_IMAGE_PATH,
    structuredData: createWebPageStructuredData({
      name: currentQuery ? `"${currentQuery}" 검색 | ${SITE_TITLE}` : `검색 | ${SITE_TITLE}`,
      description: "주제어 하나로 공개 글의 제목, 요약, 본문, 태그를 다시 찾을 수 있는 검색 페이지입니다.",
      path: "/search",
      breadcrumbs: [
        { name: SITE_TITLE, path: "/" },
        { name: "검색", path: "/search" },
      ],
    }),
  });

  useEffect(() => {
    setDraft(currentQuery);

    if (!currentQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    void searchPosts(currentQuery)
      .then((result) => {
        setResults(result.posts);
        setError(null);
      })
      .catch((reason: Error) => {
        setResults([]);
        setError(reason.message);
      })
      .finally(() => setLoading(false));
  }, [currentQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = draft.trim();

    if (!nextQuery) {
      setSearchParams({}, { replace: true });
      return;
    }

    setSearchParams({ q: nextQuery }, { replace: true });
  };

  return (
    <div className="simple-page">
      <ArchiveHeader
        eyebrow="검색"
        title="떠오른 단어 하나로 관련 글을 다시 찾기"
        description="공개된 글의 제목, 요약, 본문, 태그를 기준으로 검색합니다. private repo에서는 여기를 실제 콘텐츠 톤에 맞게 바꾸면 됩니다."
      />

      <form className="search-panel" onSubmit={handleSubmit}>
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="예: 가이드, 리뷰, 메모, 튜토리얼"
          aria-label="검색어"
        />
        <Button type="submit" className="simple-primary-button search-panel__button">
          검색
        </Button>
      </form>

      <ErrorMessage message={error} />

      {currentQuery ? (
        <section className="list-section">
          <div className="list-section__header">
            <h2>{loading ? "검색 중..." : `"${currentQuery}" 검색 결과`}</h2>
            <p>{loading ? "공개 글에서 관련 기록을 찾고 있습니다." : `${results.length}개의 글을 찾았습니다.`}</p>
          </div>

          {results.length ? (
            <div className="post-list">
              {results.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </div>
          ) : loading ? (
            <div className="empty-box">검색 결과를 불러오는 중입니다.</div>
          ) : (
            <div className="empty-box">일치하는 공개 글이 없습니다. 다른 키워드로 다시 검색해보세요.</div>
          )}
        </section>
      ) : (
        <div className="empty-box">궁금한 주제 하나만 넣어도 관련 기록을 다시 찾을 수 있습니다.</div>
      )}
    </div>
  );
}

export function AboutPage() {
  usePageMetadata({
    title: `소개 | ${SITE_TITLE}`,
    description: ABOUT_DESCRIPTION,
    path: "/about",
    image: DEFAULT_OG_IMAGE_PATH,
    structuredData: createWebPageStructuredData({
      type: "AboutPage",
      name: `소개 | ${SITE_TITLE}`,
      description: ABOUT_DESCRIPTION,
      path: "/about",
      breadcrumbs: [
        { name: SITE_TITLE, path: "/" },
        { name: "소개", path: "/about" },
      ],
    }),
  });

  return (
    <div className="simple-page">
      <ArchiveHeader
        eyebrow="소개"
        title="공개 웹, 관리자 앱, API를 나눠 운영하는 Cloudflare 블로그 템플릿"
        description="이 템플릿은 글 발행, 분류 관리, 미디어 업로드, RSS, sitemap, SEO shell 같은 기본 블로그 흐름을 Cloudflare 중심으로 구성해 둔 출발점입니다."
      />

      <section className="featured-post">
        <div className="featured-post__body">
          <div className="post-row__meta">
            <span className="simple-chip">Public Web</span>
            <span className="simple-chip">Admin CMS</span>
            <span className="simple-chip">Worker API</span>
          </div>
          <h2 className="featured-post__title">실제 블로그를 만들기 전에, 읽는 흐름과 운영 구조부터 안정적으로 갖춰 둡니다.</h2>
          <p className="featured-post__summary">
            이곳에는 실제 콘텐츠 대신 기본 구조가 들어 있습니다. private repo에서는 소개 문구, 대표 카테고리, 운영 톤을 서비스에 맞게 바꾸면 됩니다.
          </p>
        </div>

        <div className="grid gap-4">
          <section className="sidebar-box">
            <p className="sidebar-box__eyebrow">기록</p>
            <h3 className="sidebar-box__title">자주 머무는 이야기</h3>
            <p className="sidebar-box__text">
              이 섹션은 private repo에서 주력 카테고리, 브랜드 소개, 운영 원칙처럼 서비스에 맞는 내용으로 교체하면 됩니다.
            </p>
          </section>
          <section className="sidebar-box">
            <p className="sidebar-box__eyebrow">문장</p>
            <h3 className="sidebar-box__title">빠르게 읽혀도, 오래 남게</h3>
            <p className="sidebar-box__text">
              짧게 훑어도 구조가 보이고, 길게 읽어도 흐름이 끊기지 않는 기본 레이아웃을 지향합니다. 정보성 글과 기록성 글이 모두 올라와도 무리 없이 읽히는 톤을 목표로 합니다.
            </p>
          </section>
        </div>
      </section>

      <section className="list-section">
        <div className="list-section__header">
          <h2>이 블로그에서 만나는 갈래</h2>
          <p>처음 들어와도 어떤 구조의 블로그인지 한눈에 보이도록, 대표 카테고리 예시를 차분하게 정리해두었습니다.</p>
        </div>
        <div className="topic-grid">
          {ARCHIVE_GROUPS.map((group) => (
            <ArchiveGroupCard key={group.eyebrow} {...group} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function WorkerResourceRedirectPage(props: { title: string; resourcePath: string }) {
  const resourceUrl = getWorkerResourceUrl(props.resourcePath);

  usePageMetadata({
    title: `${props.title} | ${SITE_TITLE}`,
    description: `${props.title}은 Worker에서 직접 제공하는 리소스입니다.`,
    path: props.resourcePath,
    robots: "noindex,follow",
    image: DEFAULT_OG_IMAGE_PATH,
    structuredData: createWebPageStructuredData({
      name: `${props.title} | ${SITE_TITLE}`,
      description: `${props.title}은 Worker에서 직접 제공하는 리소스입니다.`,
      path: props.resourcePath,
      breadcrumbs: [
        { name: SITE_TITLE, path: "/" },
        { name: props.title, path: props.resourcePath },
      ],
    }),
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace(resourceUrl);
    }
  }, [resourceUrl]);

  return (
    <div className="simple-page">
      <ArchiveHeader
        eyebrow={props.title}
        title={`${props.title}은 Worker에서 직접 제공합니다.`}
        description="이 경로는 실제 XML 응답을 반환하는 Worker endpoint로 바로 이동합니다."
      />
      <div className="empty-box">
        브라우저가 자동으로 이동하지 않으면 아래 링크를 눌러주세요.
        <div className="mt-4">
          <a href={resourceUrl} className="simple-inline-link">
            {resourceUrl}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
