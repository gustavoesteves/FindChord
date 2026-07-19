import { describe, expect, it } from "vitest";
import { defaultWriterMaterialCategoryVisibility } from "../src/domains/writer/services/writerMaterialCategoryVisibility";

describe("F230 visibilidade inicial dos materiais no Escrever", () => {
  it("abre o braco com alvos essenciais e deixa tensoes extras sob demanda", () => {
    expect(defaultWriterMaterialCategoryVisibility()).toEqual({
      root: true,
      chordTone: true,
      characteristic: true,
      tension: false,
      avoid: false
    });
  });
});
