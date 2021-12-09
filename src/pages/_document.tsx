import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from "next/document";
import { ROOT_URL } from "../utils/arweave";

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    return initialProps;
  }

  render() {
    return (
      <Html>
        <Head>
          <link rel="shortcut icon" href="/logo_light.svg" type="image/svg" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: `
            [
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "url": "${ROOT_URL}",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "${ROOT_URL}/space?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "The Verto Protocol",
                "url": "${ROOT_URL}",
                "logo": "${ROOT_URL}/logo_light.svg"
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "url": "${ROOT_URL}",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "item": {
                      "@id": "${ROOT_URL}/space",
                      "name": "Space",
                      "description": "The place for all Arweave tokens"
                    }
                  }
                ]
              }
            ]
          `,
            }}
          ></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
