import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { O as useCoberturas, T as useAppMutation, a as EmptyState, b as keys, d as calcularCusto, g as dataBR, h as coberturasApi, i as CardTitle, k as useIngredientes, n as CardContent, r as CardHeader, s as PageShell, t as Card, u as brl, x as margem } from "./queries-BxV04iQG.mjs";
import { o as Pencil } from "../_libs/lucide-react.mjs";
import { a as Table, c as TableHead, l as TableHeader, n as ConfirmDelete, o as TableBody, s as TableCell, t as Button, u as TableRow } from "./table-CclMTdWT.mjs";
import { t as ReceitaForm } from "./ReceitaForm-DC1gca7k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/coberturas-DaC5_B-F.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CoberturasPage() {
	const { data: coberturas = [], isLoading } = useCoberturas();
	const { data: ingredientes = [] } = useIngredientes();
	const [editando, setEditando] = (0, import_react.useState)(null);
	const [chave, setChave] = (0, import_react.useState)(0);
	const salvar = useAppMutation({
		mutationFn: (input) => editando ? coberturasApi.update(editando.id, input) : coberturasApi.create(input),
		invalidate: [keys.coberturas],
		successMessage: editando ? "Cobertura atualizada!" : "Cobertura cadastrada!",
		onSuccess: () => {
			setEditando(null);
			setChave((k) => k + 1);
		}
	});
	const excluir = useAppMutation({
		mutationFn: (id) => coberturasApi.remove(id),
		invalidate: [keys.coberturas],
		successMessage: "Cobertura excluída."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		title: "Coberturas",
		subtitle: "O brilho final: receitas de cobertura com limite de 10 ingredientes e custo automático.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: editando ? `Editar ${editando.nome}` : "Nova cobertura" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceitaForm, {
				entidade: "cobertura",
				ingredientes,
				registro: editando,
				submitting: salvar.isPending,
				onSubmit: (input) => salvar.mutate(input),
				...editando ? { onCancel: () => setEditando(null) } : {}
			}, `${editando?.id ?? "novo"}-${chave}`) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
				"Receitas cadastradas (",
				coberturas.length,
				")"
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Carregando..." }) : coberturas.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Nenhuma cobertura cadastrada ainda." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Cobertura" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Custo" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Preço" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Margem" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Ações"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: coberturas.map((c) => {
				const custo = calcularCusto(c.itens, ingredientes);
				const { percentual } = margem(c.precoVenda, custo);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: c.nome
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							c.itens.length,
							" ingrediente(s) · criada em ",
							dataBR(c.criadoEm)
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: brl(custo) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: brl(c.precoVenda) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [percentual.toFixed(1), "%"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							"aria-label": "Editar",
							onClick: () => setEditando(c),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
							description: `Excluir "${c.nome}"? Coberturas vinculadas a pedidos não podem ser removidas.`,
							onConfirm: () => excluir.mutate(c.id)
						})]
					})
				] }, c.id);
			}) })] }) })] })]
		})
	});
}
//#endregion
export { CoberturasPage as component };
