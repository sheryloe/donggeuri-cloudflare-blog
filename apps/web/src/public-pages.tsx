import type { Category, CategoryFeed, Post, PostSummary, TagFeed } from "@donggeuri/shared";
import { ArrowUpRight, MoveRight } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useParams, useSearchParams } from "react-router-dom";

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
import { cn } from "./lib/utils";
import { ErrorMessage } from "./ui";

const RSS_FEED_URL = getWorkerResourceUrl("/rss.xml");
const SITEMAP_URL = getWorkerResourceUrl("/sitemap.xml");
const SITE_TITLE = "Donggri 기록들";
const SITE_TAGLINE = "정보와 세상, 시장과 기술, 그리고 동그리의 하루를 오래 읽히는 문장으로 남깁니다.";
const SITE_DESCRIPTION =
  "정보의 기록, 세상의 기록, 시장의 기록, 기술의 기록, 동그리의 기록이라는 다섯 칸 안에 문화와 축제, 역사와 이슈, 미스터리, 주식과 크립토, 신기술 리뷰, 생각과 여행을 차분하게 담아두는 블로그입니다.";

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
    eyebrow: "정보의 기록",
    title: "문화의 결, 축제의 온기, 행사의 현장을 모읍니다.",
    description:
      "지나가면 금방 흩어지는 정보도 다시 찾기 쉬운 기록으로 남깁니다. 장소와 분위기, 일정과 포인트를 서두르지 않고 정리합니다.",
    items: ["문화", "축제", "행사"],
  },
  {
    eyebrow: "세상의 기록",
    title: "오래 남는 역사와 문화, 오늘의 이슈, 설명되지 않는 미스터리를 함께 읽습니다.",
    description:
      "익숙한 사실은 더 깊게 들여다보고, 복잡한 이야기는 맥락부터 차례로 풀어갑니다. 흥미만 남기지 않고 근거와 해석의 결도 함께 적습니다.",
    items: ["역사와 문화", "이슈", "미스터리"],
  },
  {
    eyebrow: "시장의 기록",
    title: "주식과 크립토를 숫자보다 흐름으로 읽습니다.",
    description:
      "짧은 변동보다 이야기의 배경, 리스크, 시장의 공기를 함께 적습니다. 급한 판단보다 오래 남는 메모에 가까운 기록을 지향합니다.",
    items: ["주식", "크립토"],
  },
  {
    eyebrow: "기술의 기록",
    title: "새로 온 기술과 전문 채널, 좋은 글을 천천히 해석합니다.",
    description:
      "새 기술을 빠르게 훑고 끝내지 않고, 유튜브 리뷰와 글 분석을 다시 참고할 수 있게 남깁니다. 실무 감각과 개인적인 해석이 나란히 놓입니다.",
    items: ["신기술", "유튜브 리뷰", "글 분석"],
  },
  {
    eyebrow: "동그리의 기록",
    title: "생각과 일상, 여행에서 남는 작은 결들을 적습니다.",
    description:
      "일하는 마음과 이동의 풍경, 하루 끝에 남은 문장을 가볍지 않게 담아둡니다. 정보보다 감각이 오래 남는 글도 이곳에 놓입니다.",
    items: ["생각", "일상", "여행"],
  },
] as const;

const EDITORIAL_VALUES = [
  {
    eyebrow: "구조",
    title: "읽기 편한 구조",
    description:
      "첫 문단만 읽어도 핵심이 보이고, 긴 글은 소제목과 목록으로 호흡을 나눕니다. 주제가 넓어도 독자가 길을 잃지 않게 정리합니다.",
  },
  {
    eyebrow: "목록",
    title: "차분한 카테고리",
    description:
      "티스토리처럼 카테고리를 따라 천천히 훑어볼 수 있게 두고, 최신 글은 그 위에 가볍게 얹습니다. 속도보다 정돈된 탐색감을 우선합니다.",
  },
  {
    eyebrow: "가독성",
    title: "긴 글에도 버티는 호흡",
    description:
      "모바일에서도 무너지지 않는 줄 길이와 간격, 목차와 요약, 적당한 이미지 사용을 기본으로 둡니다. 오래 읽어도 지치지 않는 화면을 목표로 합니다.",
  },
  {
    eyebrow: "보안",
    title: "보안은 화면보다 분리로",
    description:
      "공개 블로그에는 공개돼도 되는 것만 보여주고, 관리자 기능은 별도 주소와 인증으로 나눕니다. 보안은 F12를 막는 것이 아니라, 내려가면 안 되는 값이 애초에 가지 않게 다루는 데 있습니다.",
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

function upsertMetaTag(selector: string, attributes: Record<string, string>, content: string) {
  if (typeof document === "undefined") {
    return;
  }

  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = title;
    upsertMetaTag('meta[name="description"]', { name: "description" }, description);
    upsertMetaTag('meta[property="og:title"]', { property: "og:title" }, title);
    upsertMetaTag('meta[property="og:description"]', { property: "og:description" }, description);
    upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }, description);
  }, [title, description]);
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
  return <span className="simple-chip">{props.category?.name ?? props.fallback ?? "분류 없음"}</span>;
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

function PrincipleCard(props: (typeof EDITORIAL_VALUES)[number]) {
  return (
    <section className="sidebar-box">
      <p className="sidebar-box__eyebrow">{props.eyebrow}</p>
      <h3 className="sidebar-box__title">{props.title}</h3>
      <p className="sidebar-box__text">{props.description}</p>
    </section>
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

function Sidebar(props: { categories: Category[] }) {
  return (
    <aside className="simple-sidebar">
      <section className="sidebar-box">
        <p className="sidebar-box__eyebrow">{SITE_TITLE}</p>
        <h2 className="sidebar-box__title">다섯 개의 기록 칸으로 세상과 하루를 모읍니다.</h2>
        <p className="sidebar-box__text">
          정보의 기록, 세상의 기록, 시장의 기록, 기술의 기록, 동그리의 기록이라는 다섯 갈래 안에서 다양한 글을 차분한
          문장과 단정한 목록으로 정리합니다.
        </p>
      </section>

      <section className="sidebar-box">
        <p className="sidebar-box__eyebrow">카테고리</p>
        {props.categories.length ? (
          <div className="sidebar-link-list">
            {props.categories.map((category) => (
              <Link key={category.id} to={`/category/${category.slug}`} className="sidebar-link-row">
                <span>{category.name}</span>
                <MoveRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="sidebar-box__text">아직 카테고리가 없습니다. 관리자에서 주제 선반을 만들면 이곳에 정리됩니다.</p>
        )}
      </section>

      <section className="sidebar-box">
        <p className="sidebar-box__eyebrow">기록의 갈래</p>
        <div className="sidebar-link-list">
          {ARCHIVE_GROUPS.map((group) => (
            <div key={group.eyebrow} className="sidebar-topic-row">
              <strong>{group.eyebrow}</strong>
              <small>{group.items.join(" · ")}</small>
            </div>
          ))}
        </div>
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
  usePageMetadata(SITE_TITLE, SITE_DESCRIPTION);

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
        title="세상의 장면과 시장의 흐름, 그리고 동그리의 하루를 천천히 모읍니다."
        description={`${SITE_DESCRIPTION} 최신 글은 위에, 카테고리는 오른쪽에 두어 티스토리처럼 차근차근 훑어볼 수 있는 블로그를 지향합니다.`}
      />

      <section className="list-section">
        <div className="list-section__header">
          <h2>카테고리는 이렇게 잡아두었습니다</h2>
          <p>하위 단어는 너무 딱딱하지 않게, 하지만 한 번 보고 바로 이해되는 말로 정리하는 방향을 택했습니다.</p>
        </div>
        <div className="topic-grid">
          {ARCHIVE_GROUPS.map((group) => (
            <ArchiveGroupCard key={group.eyebrow} {...group} />
          ))}
        </div>
      </section>

      <section className="list-section">
        <div className="list-section__header">
          <h2>지금 읽기 좋은 글</h2>
          <p>가장 최근에 올라온 글을 맨 앞에 두고, 나머지 글은 아래 목록으로 이어집니다.</p>
        </div>

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
      </section>

      <section className="list-section">
        <div className="list-section__header">
          <h2>이 블로그가 지키는 방식</h2>
          <p>심플한 화면을 유지하되, 긴 글과 다양한 주제를 버틸 수 있도록 기본 원칙을 분명하게 둡니다.</p>
        </div>
        <div className="principle-grid">
          {EDITORIAL_VALUES.slice(0, 3).map((value) => (
            <PrincipleCard key={value.title} {...value} />
          ))}
        </div>
      </section>

      <section className="list-section">
        <div className="list-section__header">
          <h2>전체 글</h2>
          <p>최신순으로 정리한 전체 목록입니다.</p>
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
  const [error, setError] = useState<string | null>(null);
  const [activeHeading, setActiveHeading] = useState("");
  const [progress, setProgress] = useState(0);

  usePageMetadata(
    post ? `${post.title} | ${SITE_TITLE}` : `글 불러오는 중 | ${SITE_TITLE}`,
    post?.excerpt ?? post?.subtitle ?? SITE_DESCRIPTION,
  );

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
          <div className="post-row__meta">
            <CategoryChip category={post?.category} />
            <span>{formatDate(post?.publishedAt ?? post?.updatedAt)}</span>
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
      </article>
    </div>
  );
}

export function CategoryArchivePage() {
  const { slug = "" } = useParams();
  const [feed, setFeed] = useState<CategoryFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePageMetadata(
    feed ? `${feed.category.name} | ${SITE_TITLE}` : `카테고리 | ${SITE_TITLE}`,
    feed?.category.description ?? "주제별로 묶인 글을 모아보는 페이지입니다.",
  );

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
      <ArchiveHeader
        eyebrow="카테고리"
        title={feed?.category.name ?? "카테고리"}
        description={feed?.category.description ?? "선택한 카테고리에 속한 글을 한곳에 모아둔 목록입니다."}
      />
      {feed?.posts.length ? (
        <div className="post-list">
          {feed.posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-box">이 카테고리에는 아직 공개된 글이 없습니다.</div>
      )}
    </div>
  );
}

export function TagArchivePage() {
  const { slug = "" } = useParams();
  const [feed, setFeed] = useState<TagFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePageMetadata(
    feed ? `#${feed.tag.name} | ${SITE_TITLE}` : `태그 | ${SITE_TITLE}`,
    feed ? `#${feed.tag.name}로 묶인 글 목록입니다.` : "선택한 태그에 연결된 글을 모아보는 페이지입니다.",
  );

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

  usePageMetadata(
    currentQuery ? `"${currentQuery}" 검색 | ${SITE_TITLE}` : `검색 | ${SITE_TITLE}`,
    "행사, 문화, 이슈, 미스터리, 주식, 크립토, AI 같은 키워드로 공개 글의 제목, 요약, 본문, 태그를 검색할 수 있습니다.",
  );

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
        title="떠오른 단어 하나로 관련 기록을 다시 찾기"
        description="공개된 글의 제목, 요약, 본문, 태그를 기준으로 검색합니다. 행사, 미스터리, 비트코인, AI처럼 주제어 하나만 넣어도 관련 글을 다시 모아볼 수 있습니다."
      />

      <form className="search-panel" onSubmit={handleSubmit}>
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="예: 축제, 미스터리, 비트코인, AI"
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
  usePageMetadata(`소개 | ${SITE_TITLE}`, SITE_DESCRIPTION);

  return (
    <div className="simple-page">
      <ArchiveHeader
        eyebrow="소개"
        title="다섯 개의 기록 칸으로 정리한 Donggri 기록들"
        description="이 블로그는 정보의 기록, 세상의 기록, 시장의 기록, 기술의 기록, 동그리의 기록이라는 다섯 칸 안에 각기 다른 글들을 무리 없이 읽히게 정리하는 아카이브입니다."
      />

      <section className="featured-post">
        <div className="featured-post__body">
          <div className="post-row__meta">
            <span className="simple-chip">심플한 레이아웃</span>
            <span className="simple-chip">카테고리 아카이브</span>
            <span className="simple-chip">긴 글 가독성</span>
          </div>
          <h2 className="featured-post__title">단순한 이름보다 오래 남는 결을 가진 카테고리를 지향합니다.</h2>
          <p className="featured-post__summary">
            {SITE_TITLE}은 주제를 마구 펼치기보다 다섯 개의 기록 칸 안에 차분히 나눠 담습니다. 그 안에서 문화와 축제, 역사와
            이슈, 미스터리, 주식과 크립토, 신기술 리뷰, 생각과 여행이 각자의 온도를 잃지 않도록 정리합니다.
          </p>
          <div className="article-page__actions">
            <a href={RSS_FEED_URL} className="simple-inline-link">
              RSS 보기
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href={SITEMAP_URL} className="simple-inline-link">
              사이트맵 보기
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          <section className="sidebar-box">
            <p className="sidebar-box__eyebrow">이름</p>
            <h3 className="sidebar-box__title">부모는 감성적으로, 자식은 직관적으로</h3>
            <p className="sidebar-box__text">
              상위 카테고리는 블로그의 결을 드러내는 말로 두고, 하위 카테고리는 한 번에 이해되는 말로 정리하는 구성이 가장
              오래 갑니다.
            </p>
          </section>
          <section className="sidebar-box">
            <p className="sidebar-box__eyebrow">탐색</p>
            <h3 className="sidebar-box__title">최신 글보다 카테고리 탐색을 먼저 생각합니다</h3>
            <p className="sidebar-box__text">
              공개 블로그는 운영자 도구보다 독자의 동선을 우선합니다. 오른쪽 선반은 카테고리 중심으로 두고, 관리자 기능은
              별도 주소에서만 다루는 편이 자연스럽습니다.
            </p>
          </section>
        </div>
      </section>

      <section className="list-section">
        <div className="list-section__header">
          <h2>지금 제안하는 카테고리 톤</h2>
          <p>하위 단어는 너무 장식적이지 않게, 대신 상위 카테고리에서 블로그의 분위기가 드러나도록 다듬었습니다.</p>
        </div>
        <div className="topic-grid">
          {ARCHIVE_GROUPS.map((group) => (
            <ArchiveGroupCard key={group.eyebrow} {...group} />
          ))}
        </div>
      </section>

      <section className="list-section">
        <div className="list-section__header">
          <h2>이 블로그가 지키는 원칙</h2>
          <p>겉모양보다 읽는 흐름, 그리고 보여도 되는 것과 숨겨야 하는 것의 경계를 분명하게 둡니다.</p>
        </div>
        <div className="principle-grid">
          {EDITORIAL_VALUES.map((value) => (
            <PrincipleCard key={value.title} {...value} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function WorkerResourceRedirectPage(props: { title: string; resourcePath: string }) {
  const resourceUrl = getWorkerResourceUrl(props.resourcePath);

  usePageMetadata(`${props.title} | ${SITE_TITLE}`, `${props.title}은 Worker에서 직접 제공하는 리소스입니다.`);

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
