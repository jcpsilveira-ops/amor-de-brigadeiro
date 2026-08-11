import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { A as usePedidos, C as pedidosApi, D as useClientes, E as useBolos, O as useCoberturas, S as pedidoSchema, T as useAppMutation, _ as hojeISO, a as EmptyState, b as keys, d as calcularCusto, g as dataBR, i as CardTitle, k as useIngredientes, n as CardContent, o as FieldError, r as CardHeader, s as PageShell, t as Card, u as brl } from "./queries-BxV04iQG.mjs";
import { o as Pencil } from "../_libs/lucide-react.mjs";
import { a as Table, c as TableHead, i as Label, l as TableHeader, n as ConfirmDelete, o as TableBody, r as Input, s as TableCell, t as Button, u as TableRow } from "./table-CclMTdWT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BjRSQHh7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pedidos-Ci15sWqS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SEM_COBERTURA = "sem";
function PedidosPage() {
	const { data: pedidos = [], isLoading } = usePedidos();
	const { data: clientes = [] } = useClientes();
	const { data: bolos = [] } = useBolos();
	const { data: coberturas = [] } = useCoberturas();
	const { data: ingredientes = [] } = useIngredientes();
	const [editando, setEditando] = (0, import_react.useState)(null);
	const [clienteId, setClienteId] = (0, import_react.useState)("");
	const [boloId, setBoloId] = (0, import_react.useState)("");
	const [coberturaId, setCoberturaId] = (0, import_react.useState)(SEM_COBERTURA);
	const [data, setData] = (0, import_react.useState)(hojeISO());
	const [tocado, setTocado] = (0, import_react.useState)(false);
	const parsed = pedidoSchema.safeParse({
		clienteId,
		boloId,
		coberturaId: coberturaId === SEM_COBERTURA ? null : coberturaId,
		data
	});
	const erros = {};
	if (!parsed.success) for (const issue of parsed.error.issues) erros[issue.path.join(".")] = issue.message;
	function limpar() {
		setEditando(null);
		setClienteId("");
		setBoloId("");
		setCoberturaId(SEM_COBERTURA);
		setData(hojeISO());
		setTocado(false);
	}
	const salvar = useAppMutation({
		mutationFn: async () => {
			if (!parsed.success) return;
			return editando ? pedidosApi.update(editando.id, parsed.data) : pedidosApi.create(parsed.data);
		},
		invalidate: [keys.pedidos],
		successMessage: editando ? "Pedido atualizado!" : "Pedido registrado!",
		onSuccess: limpar
	});
	const excluir = useAppMutation({
		mutationFn: (id) => pedidosApi.remove(id),
		invalidate: [keys.pedidos],
		successMessage: "Pedido excluído."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, {
		title: "Pedidos",
		subtitle: "Cliente + bolo + cobertura, com custo e preço somados na hora.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[380px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: editando ? `Editar pedido #${editando.id}` : "Novo pedido" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-4",
				onSubmit: (e) => {
					e.preventDefault();
					setTocado(true);
					if (parsed.success) salvar.mutate(void 0);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cliente" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: clienteId,
							onValueChange: setClienteId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione o cliente" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: clientes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: String(c.id),
								children: c.nome
							}, c.id)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado ? erros["clienteId"] : void 0 })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Bolo" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: boloId,
							onValueChange: setBoloId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione o bolo" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: bolos.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: String(b.id),
								children: [
									b.nome,
									" — ",
									brl(b.precoVenda)
								]
							}, b.id)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado ? erros["boloId"] : void 0 })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cobertura" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: coberturaId,
						onValueChange: setCoberturaId,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione a cobertura" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: SEM_COBERTURA,
							children: "Sem cobertura"
						}), coberturas.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: String(c.id),
							children: [
								c.nome,
								" — ",
								brl(c.precoVenda)
							]
						}, c.id))] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "data",
							children: "Data do pedido"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "data",
							type: "date",
							value: data,
							onChange: (e) => setData(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldError, { message: tocado ? erros["data"] : void 0 })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: salvar.isPending,
							children: editando ? "Salvar alterações" : "Registrar pedido"
						}), editando ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							onClick: limpar,
							children: "Cancelar"
						}) : null]
					})
				]
			}) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
				"Pedidos registrados (",
				pedidos.length,
				")"
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Carregando..." }) : pedidos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Nenhum pedido registrado ainda." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "#" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Cliente" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Bolo / Cobertura" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Data" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Custo" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Total" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Ações"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: pedidos.map((p) => {
				const cliente = clientes.find((c) => c.id === p.clienteId);
				const bolo = bolos.find((b) => b.id === p.boloId);
				const cobertura = coberturas.find((c) => c.id === p.coberturaId);
				const custo = (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) + (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0);
				const total = (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-muted-foreground",
						children: p.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: cliente?.nome ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: bolo?.nome ?? "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: cobertura?.nome ?? "Sem cobertura"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: dataBR(p.data) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: brl(custo) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: brl(total)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							"aria-label": "Editar",
							onClick: () => {
								setEditando(p);
								setClienteId(String(p.clienteId));
								setBoloId(String(p.boloId));
								setCoberturaId(p.coberturaId ? String(p.coberturaId) : SEM_COBERTURA);
								setData(p.data.slice(0, 10));
								setTocado(false);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
							description: `Excluir o pedido #${p.id}?`,
							onConfirm: () => excluir.mutate(p.id)
						})]
					})
				] }, p.id);
			}) })] }) })] })]
		})
	});
}
//#endregion
export { PedidosPage as component };
