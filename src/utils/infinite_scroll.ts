import { useEffect, useState } from "react";

export default function useInfiniteScroll<T>(
  loadMore: () => Promise<T[]>,
  initialData?: T[]
) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [noMore, setNoMore] = useState(false);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    if (!initialData) setLoading(true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!loading || noMore) return;
    load();
  }, [loading]);

  async function handleScroll() {
    if (document.body.clientHeight - window.innerHeight < window.scrollY + 300)
      setLoading(true);
  }

  async function load() {
    setLoading(true);

    const lastScrollY = window.scrollY;
    const addData = await loadMore();

    if (addData.length === 0) {
      setLoading(false);
      return setNoMore(true);
    }

    setData((val) => [...val, ...addData]);
    setTimeout(() => setLoading(false), 350);
    window.scrollTo(window.scrollX, lastScrollY);
  }

  return { loading, data };
}
