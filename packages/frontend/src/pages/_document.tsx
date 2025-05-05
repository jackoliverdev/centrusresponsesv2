import { Head, Html, Main, NextScript } from "next/document";
import classNames from "classnames";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className={classNames("antialiased")}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
