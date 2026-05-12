<script>
import {
  APP_SEO_DESCRIPTION,
  APP_SEO_KEYWORDS,
  APP_SITE_URL,
  APP_TITLE
} from "./constants/app";

function setMetaAttr(name, content) {
  if (typeof document === "undefined" || !content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaProperty(property, content) {
  if (typeof document === "undefined" || !content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default {
  onLaunch() {
    // #ifdef H5
    if (typeof document !== "undefined") {
      document.title = APP_TITLE;
      setMetaAttr("description", APP_SEO_DESCRIPTION);
      setMetaAttr("keywords", APP_SEO_KEYWORDS);
      if (APP_SITE_URL) {
        setMetaProperty("og:url", APP_SITE_URL.replace(/\/$/, "") + "/");
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
          link = document.createElement("link");
          link.setAttribute("rel", "canonical");
          document.head.appendChild(link);
        }
        link.setAttribute("href", APP_SITE_URL.replace(/\/$/, "") + "/");
      }
    }
    // #endif
  },
  onShow() {},
  onHide() {}
};
</script>

<style lang="scss">
page {
  background: #f3f4f6;
  color: #1f2937;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
</style>

