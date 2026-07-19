import { describe, expect, it } from "vitest";
import {
  buildWriterMaterialRoutes,
  DEFAULT_WRITER_MATERIAL_ROUTE_ID,
  itemsForWriterMaterialRoute,
  presentWriterMaterialRoute,
  resolveWriterMaterialRoute,
  routeForWriterMaterialIntent,
  routeForWriterMaterialItem,
  visibleWriterMaterialRoutes
} from "../src/domains/writer/services/writerMaterialRoutes";
import { writerMaterialTestItem } from "./helpers/writerMaterialTestFactory";

describe("F237 rotas musicais para materiais do acorde", () => {
  const palette = [
    writerMaterialTestItem("Dentro", "C major"),
    writerMaterialTestItem("Funcional", "C lydian"),
    writerMaterialTestItem("Cor", "C pentatonic"),
    writerMaterialTestItem("Tensão", "C altered"),
    writerMaterialTestItem("Fora", "C outside")
  ];

  it("deriva a rota pela intencao musical", () => {
    expect(routeForWriterMaterialIntent("Dentro")).toBe("inside");
    expect(routeForWriterMaterialIntent("Funcional")).toBe("color");
    expect(routeForWriterMaterialIntent("Cor")).toBe("color");
    expect(routeForWriterMaterialIntent("Tensão")).toBe("tension");
    expect(routeForWriterMaterialIntent("Fora")).toBe("outside");
  });

  it("classifica itens por rota musical", () => {
    expect(routeForWriterMaterialItem(palette[0])).toBe("inside");
    expect(routeForWriterMaterialItem(palette[1])).toBe("color");
    expect(routeForWriterMaterialItem(palette[2])).toBe("color");
    expect(routeForWriterMaterialItem(palette[3])).toBe("tension");
    expect(routeForWriterMaterialItem(palette[4])).toBe("outside");
  });

  it("comeca pela rota mais repousada", () => {
    expect(DEFAULT_WRITER_MATERIAL_ROUTE_ID).toBe("inside");
  });

  it("monta rotas em ordem estavel", () => {
    const routes = buildWriterMaterialRoutes(palette);
    expect(routes.map(route => [route.id, route.items.length])).toEqual([
      ["inside", 1],
      ["color", 2],
      ["tension", 1],
      ["outside", 1]
    ]);
  });

  it("mantem os textos musicais das rotas", () => {
    const routes = buildWriterMaterialRoutes(palette);
    expect(routes.map(route => [route.id, route.label, route.description])).toEqual([
      ["inside", "Ficar dentro", "Apoiar o acorde e manter repouso claro."],
      ["color", "Colorir", "Adicionar uma cor reconhecível sem sair do centro."],
      ["tension", "Tensionar", "Criar instabilidade controlada antes do retorno."],
      ["outside", "Sair e voltar", "Deslocar para fora e retornar aos apoios do acorde."]
    ]);
  });

  it("exibe apenas rotas com material disponivel", () => {
    const routes = buildWriterMaterialRoutes([writerMaterialTestItem("Cor", "C lydian")]);
    expect(visibleWriterMaterialRoutes(routes).map(route => route.id)).toEqual(["color"]);
  });

  it("preserva a ordem musical das rotas disponiveis", () => {
    const routes = buildWriterMaterialRoutes([
      writerMaterialTestItem("Tensão", "C altered"),
      writerMaterialTestItem("Dentro", "C major")
    ]);
    expect(visibleWriterMaterialRoutes(routes).map(route => route.id)).toEqual(["inside", "tension"]);
  });

  it("filtra a paleta por rota", () => {
    expect(itemsForWriterMaterialRoute(palette, "color").map(routeItem => routeItem.source.name)).toEqual([
      "C lydian",
      "C pentatonic"
    ]);
  });

  it("mantem a rota preferida quando ela tem conteudo", () => {
    expect(resolveWriterMaterialRoute("color", buildWriterMaterialRoutes(palette))).toBe("color");
  });

  it("cai para a primeira rota com conteudo quando a preferida esta vazia", () => {
    const routes = buildWriterMaterialRoutes([writerMaterialTestItem("Dentro", "C major")]);
    expect(resolveWriterMaterialRoute("color", routes)).toBe("inside");
  });

  it("apresenta rotas com poucas ideias como rota objetiva", () => {
    expect(presentWriterMaterialRoute([writerMaterialTestItem("Funcional", "C lydian")])).toMatchObject({
      isSparse: true,
      markerLabel: "Rota objetiva",
      listClassName: "sm:grid-cols-1 max-h-none overflow-visible",
      cardClassName: "p-3"
    });
  });

  it("mantem grade compacta quando ha volume de ideias", () => {
    const presentation = presentWriterMaterialRoute([
      writerMaterialTestItem("Funcional", "C lydian"),
      writerMaterialTestItem("Cor", "C pentatonic"),
      writerMaterialTestItem("Tensão", "C altered")
    ]);

    expect(presentation.isSparse).toBe(false);
    expect(presentation.markerLabel).toBeUndefined();
    expect(presentation.listClassName).toBe("sm:grid-cols-2 max-h-[210px] overflow-y-auto");
    expect(presentation.cardClassName).toBe("p-2.5");
  });
});
