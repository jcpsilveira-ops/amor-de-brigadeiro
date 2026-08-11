import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { d as calcularCusto, o as FieldError, u as brl, w as receitaSchema, x as margem } from "./queries-BxV04iQG.mjs";
import { a as Plus, t as X } from "../_libs/lucide-react.mjs";
import { i as Label, r as Input, t as Button } from "./table-CclMTdWT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BjRSQHh7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ReceitaForm-DC1gca7k.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReceitaForm({ ingredientes, registro, submitting, onSubmit, onCancel, entidade }) {
	const [nome, setNome] = (0, import_react.useState)(registro?.nome ?? "");
	const [precoVenda, setPrecoVenda] = (0, import_react.useState)(registro ? String(registro.precoVenda) : "");
	const [linhas, setLinhas] = (0, import_react.useState)(registro?.itens.length ? registro.itens.map((i) => ({
		ingredienteId: String(i.ingredienteId),
		quantidade: String(i.quantidade)
	})) : [{
		ingredienteId: "",
		quantidade: ""
	}]);
	const [tocado, setTocado] = (0, import_react.useState)(false);
	const candidato = (0, import_react.useMemo)(() => ({
		nome,
		precoVenda,
		itens: linhas.filter((l) => l.ingredienteId !== "" || l.quantidade !== "").map((l) => ({
			ingredienteId: l.ingredienteId,
			quantidade: l.quantidade
		}))
	}), [
		nome,
		precoVenda,
		linhas
	]);
	const parsed = receitaSchema.safeParse(candidato);
	const erros = (0, import_react.useMemo)(() => {
		if (parsed.success) return {};
		const out = {};
		for (const issue of parsed.error.issues) out[issue.path.join(".") || "itens"] = issue.message;
		return out;
	}, [parsed]);
	const custo = parsed.success ? calcularCusto(parsed.data.itens, ingredientes) : 0;
	const { lucro, percentual } = margem(parsed.success ? parsed.data.precoVenda : 0, custo);
	const usados = new Set(linhas.map((l) => l.ingredienteId).filter(Boolean));
	function atualizar(index, patch) {
		setLinhas((prev) => prev.map((l, i) => i === index ? {
			...l,
			...patch
		} : l));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "space-y-5",
		onSubmit: (event) => {
			event.preventDefault();
			setTocado(true);
			if (parsed.success) onSubmit(parsed.data);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
						htmlFor: "nome",
						children: ["Nome do ", entidade]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "nome",
						value: nome,
						onChange: (e) => setNome(e.target.value),
						placeholder: entidade === "bolo" ? "Bolo de chocolate" : "Brigadeiro cremoso"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: (tocado || nome !== "") && erros["nome"] ? erros["nome"] : void 0 })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "preco",
						children: "Preço de venda (R$)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "preco",
						inputMode: "decimal",
						value: precoVenda,
						onChange: (e) => setPrecoVenda(e.target.value.replace(",", ".")),
						placeholder: "0,00"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: (tocado || precoVenda !== "") && erros["precoVenda"] ? erros["precoVenda"] : void 0 })
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "label-caps",
							children: [
								"Ingredientes (",
								linhas.length,
								"/",
								10,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "secondary",
							size: "sm",
							disabled: linhas.length >= 10,
							onClick: () => setLinhas((p) => [...p, {
								ingredienteId: "",
								quantidade: ""
							}]),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Adicionar"]
						})]
					}),
					linhas.map((linha, index) => {
						const ing = ingredientes.find((i) => String(i.id) === linha.ingredienteId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2 sm:grid-cols-[1fr_150px_auto] sm:items-end",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: linha.ingredienteId,
									onValueChange: (value) => atualizar(index, { ingredienteId: value }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione o ingrediente" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ingredientes.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: String(i.id),
										disabled: usados.has(String(i.id)) && linha.ingredienteId !== String(i.id),
										children: [
											i.nome,
											" — ",
											brl(i.custoUnitario),
											"/",
											i.unidade
										]
									}, i.id)) })]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									inputMode: "decimal",
									value: linha.quantidade,
									onChange: (e) => atualizar(index, { quantidade: e.target.value.replace(",", ".") }),
									placeholder: ing ? `Qtd em ${ing.unidade}` : "Quantidade"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									size: "sm",
									className: "text-destructive hover:bg-destructive/10",
									disabled: linhas.length === 1,
									onClick: () => setLinhas((p) => p.filter((_, i) => i !== index)),
									"aria-label": "Remover ingrediente",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
								})
							]
						}, index);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado ? erros["itens"] ?? erros["itens.0.ingredienteId"] ?? erros["itens.0.quantidade"] : void 0 }),
					ingredientes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Cadastre ingredientes primeiro para montar a receita."
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 rounded-xl bg-secondary/70 p-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Resumo, {
						rotulo: "Custo de produção",
						valor: brl(custo)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Resumo, {
						rotulo: "Lucro estimado",
						valor: brl(lucro)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Resumo, {
						rotulo: "Margem",
						valor: `${percentual.toFixed(1)}%`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: submitting,
					children: registro ? "Salvar alterações" : `Cadastrar ${entidade}`
				}), onCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					onClick: onCancel,
					children: "Cancelar"
				}) : null]
			})
		]
	});
}
function Resumo({ rotulo, valor }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "label-caps",
		children: rotulo
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "font-display text-xl text-primary",
		children: valor
	})] });
}
//#endregion
export { ReceitaForm as t };
