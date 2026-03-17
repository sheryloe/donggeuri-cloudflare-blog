import Lenis from "lenis";
import { useEffect } from "react";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import {
  AboutPage,
  CategoryArchivePage,
  HomePage,
  PostPage,
  PublicLayout,
  SearchPage,
  TagArchivePage,
  WorkerResourceRedirectPage,
} from "./public-pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "post/:slug", element: <PostPage /> },
      { path: "category/:slug", element: <CategoryArchivePage /> },
      { path: "tag/:slug", element: <TagArchivePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "search", element: <SearchPage /> },
      {
        path: "rss.xml",
        element: <WorkerResourceRedirectPage title="RSS" resourcePath="/rss.xml" />,
      },
      {
        path: "sitemap.xml",
        element: <WorkerResourceRedirectPage title="사이트맵" resourcePath="/sitemap.xml" />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.12,
      smoothWheel: true,
      touchMultiplier: 1.1,
    });

    let frameId = 0;

    const frame = (time: number) => {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(frame);
    };

    frameId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return <RouterProvider router={router} />;
}
