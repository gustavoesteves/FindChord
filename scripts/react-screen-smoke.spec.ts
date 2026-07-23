import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HarmonizerScreen from "../src/domains/harmonizer/HarmonizerScreen";
import WriterScreen from "../src/domains/writer/WriterScreen";

describe("React screen smoke coverage", () => {
  it("renders the Writer journey without browser-only state", () => {
    const html = renderToString(createElement(WriterScreen));

    expect(html).toContain("Braço");
    expect(html).toContain("Leitura do acorde");
    expect(html).toContain("Materiais do acorde");
  });

  it("renders the Harmonizer journey without browser-only state", () => {
    const html = renderToString(createElement(HarmonizerScreen));

    expect(html).toContain("Harmonizações");
    expect(html).toContain("Improviso");
    expect(html).toContain("Sincronizar Partitura");
  });
});
