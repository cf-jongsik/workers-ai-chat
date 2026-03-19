declare module "markdown-to-jsx" {
  import * as React from "react";

  interface MarkdownOptions {
    forceBlock?: boolean;
    forceInline?: boolean;
    wrapper?: React.ElementType | null | false;
    overrides?: Record<
      string,
      {
        component?: React.ComponentType<any>;
        props?: Record<string, any>;
      }
    >;
    createElement?: typeof React.createElement;
    slugify?: (text: string) => string;
    namedCodesToUnicode?: Record<string, string>;
    disableParsingRawHTML?: boolean;
    parseBlockHtml?: boolean;
    renderers?: Record<string, React.ComponentType<any>>;
  }

  interface MarkdownProps extends MarkdownOptions {
    children: string;
  }

  export default function MarkdownToJSX(
    props: MarkdownProps,
  ): React.ReactElement;
  export function compiler(
    markdown: string,
    options?: MarkdownOptions,
  ): React.ReactElement;
}
