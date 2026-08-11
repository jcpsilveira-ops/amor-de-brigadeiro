import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { T as useAppMutation, a as EmptyState, b as keys, c as UNIDADES, i as CardTitle, k as useIngredientes, n as CardContent, o as FieldError, r as CardHeader, s as PageShell, t as Card, u as brl, v as ingredienteSchema, y as ingredientesApi } from "./queries-BxV04iQG.mjs";
import { o as Pencil } from "../_libs/lucide-react.mjs";
import { a as Table, c as TableHead, i as Label, l as TableHeader, n as ConfirmDelete, o as TableBody, r as Input, s as TableCell, t as Button, u as TableRow } from "./table-CclMTdWT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BjRSQHh7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ingredientes-B3H4hnR9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function IngredientesPage() {
	const { data: ingredientes = [], isLoading } = useIngredientes();
	const [editando, setEditando] = (0, import_react.useState)(null);
	const [nome, setNome] = (0, import_react.useState)("");
	const [unidade, setUnidade] = (0, import_react.useState)("");
	const [custo, setCusto] = (0, import_react.useState)("");
	const [tocado, setTocado] = (0, import_react.useState)(false);
	const parsed = ingredienteSchema.safeParse({
		nome,
		unidade,
		custoUnitario: custo
	});
	const erros = {};
	if (!parsed.success) for (const issue of parsed.error.issues) erros[issue.path.join(".")] = issue.message;
	function limpar() {
		setEditando(null);
		setNome("");
		setUnidade("");
		setCusto("");
		setTocado(false);
	}
	const salvar = useAppMutation({
		mutationFn: async () => {
			if (!parsed.success) return;
			return editando ? ingredientesApi.update(editando.id, parsed.data) : ingredientesApi.create(parsed.data);
		},
		invalidate: [
			keys.ingredientes,
			keys.bolos,
			keys.coberturas
		],
		successMessage: editando ? "Ingrediente atualizado!" : "Ingrediente cadastrado!",
		onSuccess: limpar
	});
	const excluir = useAppMutation({
		mutationFn: (id) => ingredientesApi.remove(id),
		invalidate: [keys.ingredientes],
		successMessage: "Ingrediente excluído."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		title: "Ingredientes",
		subtitle: "Base de custos da confeitaria: cada ingrediente alimenta o cálculo automático das receitas.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[380px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: editando ? "Editar ingrediente" : "Novo ingrediente" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-4",
				onSubmit: (e) => {
					e.preventDefault();
					setTocado(true);
					if (parsed.success) salvar.mutate(void 0);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "nome",
							children: "Nome"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "nome",
							value: nome,
							onChange: (e) => setNome(e.target.value),
							placeholder: "Leite condensado"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado || nome !== "" ? erros["nome"] : void 0 })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "unidade",
							children: "Unidade"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: unidade,
							onValueChange: (v) => setUnidade(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								id: "unidade",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione a unidade" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: UNIDADES.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: u,
								children: u
							}, u)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado ? erros["unidade"] : void 0 })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "custo",
							children: "Custo unitário (R$)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "custo",
							inputMode: "decimal",
							value: custo,
							onChange: (e) => setCusto(e.target.value.replace(",", ".")),
							placeholder: "0,00"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado || custo !== "" ? erros["custoUnitario"] : void 0 })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: salvar.isPending,
							children: editando ? "Salvar alterações" : "Cadastrar"
						}), editando ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							onClick: limpar,
							children: "Cancelar"
						}) : null]
					})
				]
			}) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
				"Cadastrados (",
				ingredientes.length,
				")"
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Carregando..." }) : ingredientes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Nenhum ingrediente cadastrado ainda." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Nome" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Unidade" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Custo" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Ações"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: ingredientes.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-semibold",
					children: i.nome
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-muted-foreground",
					children: i.unidade
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: brl(i.custoUnitario) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "sm",
						"aria-label": "Editar",
						onClick: () => {
							setEditando(i);
							setNome(i.nome);
							setUnidade(i.unidade);
							setCusto(String(i.custoUnitario));
							setTocado(false);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
						description: `Excluir "${i.nome}"? Ingredientes usados em receitas não podem ser removidos.`,
						onConfirm: () => excluir.mutate(i.id)
					})]
				})
			] }, i.id)) })] }) })] })]
		})
	});
}
//#endregion
export { IngredientesPage as component };
