import { describe, expect, it } from "vitest";
import { resolveWriterMaterialFocus } from "../src/domains/writer/services/writerMaterialFocus";
import {
  writerMaterialTestItem,
  writerMaterialTestSource
} from "./helpers/writerMaterialTestFactory";

describe("F235 foco inicial dos materiais do acorde", () => {
  const firstSource = writerMaterialTestSource("C Lydian", { type: "lydian" });
  const selectedSource = writerMaterialTestSource("C Major", { type: "major" });
  const palette = [
    writerMaterialTestItem("Cor", "Cor lídia", { source: firstSource })
  ];
  const paletteWithSelectedSource = [
    ...palette,
    writerMaterialTestItem("Dentro", "Repouso maior", { source: selectedSource })
  ];

  it("usa a primeira ideia da paleta quando nada foi escolhido", () => {
    expect(resolveWriterMaterialFocus(null, palette)).toBe(firstSource);
  });

  it("respeita a escolha explicita do usuario", () => {
    expect(resolveWriterMaterialFocus(selectedSource, paletteWithSelectedSource)).toBe(selectedSource);
  });

  it("descarta escolha antiga quando ela nao pertence a paleta ativa", () => {
    expect(resolveWriterMaterialFocus(selectedSource, palette)).toBe(firstSource);
  });

  it("retorna nulo quando nao ha paleta", () => {
    expect(resolveWriterMaterialFocus(null, [])).toBeNull();
  });
});
