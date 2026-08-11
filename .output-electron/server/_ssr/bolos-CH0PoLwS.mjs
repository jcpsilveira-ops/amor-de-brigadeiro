import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { E as useBolos, T as useAppMutation, a as EmptyState, b as keys, d as calcularCusto, g as dataBR, i as CardTitle, k as useIngredientes, l as bolosApi, n as CardContent, r as CardHeader, s as PageShell, t as Card, u as brl, x as margem } from "./queries-BxV04iQG.mjs";
import { o as Pencil } from "../_libs/lucide-react.mjs";
import { a as Table, c as TableHead, l as TableHeader, n as ConfirmDelete, o as TableBody, s as TableCell, t as Button, u as TableRow } from "./table-CclMTdWT.mjs";
import { t as ReceitaForm } from "./ReceitaForm-DC1gca7k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bolos-CH0PoLwS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BolosPage() {
	const { data: bolos = [], isLoading } = useBolos();
	const { data: ingredientes = [] } = useIngredientes();
	const [editando, setEditando] = (0, import_react.useState)(null);
	const [chave, setChave] = (0, import_react.useState)(0);
	const salvar = useAppMutation({
		mutationFn: (input) => editando ? bolosApi.update(editando.id, input) : bolosApi.create(input),
		invalidate: [keys.bolos],
		successMessage: editando ? "Bolo atualizado!" : "Bolo cadastrado!",
		onSuccess: () => {
			setEditando(null);
			setChave((k) => k + 1);
		}
	});
	const excluir = useAppMutation({
		mutationFn: (id) => bolosApi.remove(id),
		invalidate: [keys.bolos],
		successMessage: "Bolo excluído."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		title: "Bolos",
		subtitle: "Até 10 ingredientes por receita, com custo de produção calculado automaticamente.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: editando ? `Editar ${editando.nome}` : "Novo bolo" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceitaForm, {
				entidade: "bolo",
				ingredientes,
				registro: editando,
				submitting: salvar.isPending,
				onSubmit: (input) => salvar.mutate(input),
				...editando ? { onCancel: () => setEditando(null) } : {}
			}, `${editando?.id ?? "novo"}-${chave}`) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
				"Receitas cadastradas (",
				bolos.length,
				")"
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Carregando..." }) : bolos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Nenhum bolo cadastrado ainda." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Bolo" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Custo" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Preço" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Margem" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Ações"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: bolos.map((b) => {
				const custo = calcularCusto(b.itens, ingredientes);
				const { percentual } = margem(b.precoVenda, custo);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: b.nome
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							b.itens.length,
							" ingrediente(s) · criado em ",
							dataBR(b.criadoEm)
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: brl(custo) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: brl(b.precoVenda) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [percentual.toFixed(1), "%"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							"aria-label": "Editar",
							onClick: () => setEditando(b),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
							description: `Excluir "${b.nome}"? Bolos vinculados a pedidos não podem ser removidos.`,
							onConfirm: () => excluir.mutate(b.id)
						})]
					})
				] }, b.id);
			}) })] }) })] })]
		})
	});
}
//#endregion
export { BolosPage as component };
