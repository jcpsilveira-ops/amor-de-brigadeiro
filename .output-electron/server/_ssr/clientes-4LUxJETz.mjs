import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { D as useClientes, T as useAppMutation, a as EmptyState, b as keys, f as clienteSchema, i as CardTitle, n as CardContent, o as FieldError, p as clientesApi, r as CardHeader, s as PageShell, t as Card } from "./queries-BxV04iQG.mjs";
import { o as Pencil, s as MessageCircle } from "../_libs/lucide-react.mjs";
import { a as Table, c as TableHead, i as Label, l as TableHeader, n as ConfirmDelete, o as TableBody, r as Input, s as TableCell, t as Button, u as TableRow } from "./table-CclMTdWT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clientes-4LUxJETz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClientesPage() {
	const { data: clientes = [], isLoading } = useClientes();
	const [editando, setEditando] = (0, import_react.useState)(null);
	const [nome, setNome] = (0, import_react.useState)("");
	const [whatsapp, setWhatsapp] = (0, import_react.useState)("");
	const [tocado, setTocado] = (0, import_react.useState)(false);
	const parsed = clienteSchema.safeParse({
		nome,
		whatsapp
	});
	const erros = {};
	if (!parsed.success) for (const issue of parsed.error.issues) erros[issue.path.join(".")] = issue.message;
	function limpar() {
		setEditando(null);
		setNome("");
		setWhatsapp("");
		setTocado(false);
	}
	const salvar = useAppMutation({
		mutationFn: async () => {
			if (!parsed.success) return;
			return editando ? clientesApi.update(editando.id, parsed.data) : clientesApi.create(parsed.data);
		},
		invalidate: [keys.clientes],
		successMessage: editando ? "Cliente atualizado!" : "Cliente cadastrado!",
		onSuccess: limpar
	});
	const excluir = useAppMutation({
		mutationFn: (id) => clientesApi.remove(id),
		invalidate: [keys.clientes],
		successMessage: "Cliente excluído."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		title: "Clientes",
		subtitle: "Quem faz a doçura acontecer — contatos sempre à mão.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[380px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: editando ? "Editar cliente" : "Novo cliente" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
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
							placeholder: "Marina Souza"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado || nome !== "" ? erros["nome"] : void 0 })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "whatsapp",
							children: "WhatsApp"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "whatsapp",
							value: whatsapp,
							onChange: (e) => setWhatsapp(e.target.value),
							placeholder: "(11) 98888-1234"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado || whatsapp !== "" ? erros["whatsapp"] : void 0 })
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
				clientes.length,
				")"
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Carregando..." }) : clientes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Nenhum cliente cadastrado ainda." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Nome" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "WhatsApp" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Ações"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: clientes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-semibold",
					children: c.nome
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "inline-flex items-center gap-1.5 text-accent hover:underline",
					href: `https://wa.me/${encodeURIComponent(c.whatsapp.replace(/\D/g, ""))}`,
					target: "_blank",
					rel: "noreferrer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), c.whatsapp]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "sm",
						"aria-label": "Editar",
						onClick: () => {
							setEditando(c);
							setNome(c.nome);
							setWhatsapp(c.whatsapp);
							setTocado(false);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
						description: `Excluir "${c.nome}"? Clientes com pedidos não podem ser removidos.`,
						onConfirm: () => excluir.mutate(c.id)
					})]
				})
			] }, c.id)) })] }) })] })]
		})
	});
}
//#endregion
export { ClientesPage as component };
