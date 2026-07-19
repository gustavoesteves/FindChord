import { describe, expect, it } from "vitest";
import {
  defaultWriterMaterialCategoryVisibility,
  effectiveWriterMaterialCategoryVisibility
} from "../src/domains/writer/services/writerMaterialCategoryVisibility";

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

  it("abre tensoes automaticamente na rota de tensionar sem alterar o repouso", () => {
    expect(effectiveWriterMaterialCategoryVisibility("tension", defaultWriterMaterialCategoryVisibility())).toEqual({
      root: true,
      chordTone: true,
      characteristic: true,
      tension: true,
      avoid: false
    });
  });

  it("abre tensoes e passagens na rota outside", () => {
    expect(effectiveWriterMaterialCategoryVisibility("outside", defaultWriterMaterialCategoryVisibility())).toEqual({
      root: true,
      chordTone: true,
      characteristic: true,
      tension: true,
      avoid: true
    });
  });
});
