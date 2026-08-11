import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { A as usePedidos, D as useClientes, E as useBolos, O as useCoberturas, d as calcularCusto, g as dataBR, i as CardTitle, k as useIngredientes, n as CardContent, r as CardHeader, s as PageShell, t as Card, u as brl, x as margem } from "./queries-BxV04iQG.mjs";
import { c as Layers, m as Cake, n as Wheat, r as Users, u as ClipboardList } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-WtKCvGeV.js
var import_jsx_runtime = require_jsx_runtime();
var atalhos = [
	{
		to: "/ingredientes",
		label: "Ingredientes",
		icon: Wheat
	},
	{
		to: "/bolos",
		label: "Bolos",
		icon: Cake
	},
	{
		to: "/coberturas",
		label: "Coberturas",
		icon: Layers
	},
	{
		to: "/clientes",
		label: "Clientes",
		icon: Users
	},
	{
		to: "/pedidos",
		label: "Pedidos",
		icon: ClipboardList
	}
];
function Painel() {
	const { data: ingredientes = [] } = useIngredientes();
	const { data: bolos = [] } = useBolos();
	const { data: coberturas = [] } = useCoberturas();
	const { data: clientes = [] } = useClientes();
	const { data: pedidos = [] } = usePedidos();
	const receitaPrevista = pedidos.reduce((acc, p) => {
		const bolo = bolos.find((b) => b.id === p.boloId);
		const cobertura = coberturas.find((c) => c.id === p.coberturaId);
		return acc + (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0);
	}, 0);
	const custoPrevisto = pedidos.reduce((acc, p) => {
		const bolo = bolos.find((b) => b.id === p.boloId);
		const cobertura = coberturas.find((c) => c.id === p.coberturaId);
		return acc + (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) + (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0);
	}, 0);
	const { percentual } = margem(receitaPrevista, custoPrevisto);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageShell, {
		title: "Painel da confeitaria",
		subtitle: "Uma visão rápida das receitas, dos clientes e do dinheiro que entra.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metrica, {
					rotulo: "Faturamento em pedidos",
					valor: brl(receitaPrevista)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metrica, {
					rotulo: "Custo de produção",
					valor: brl(custoPrevisto)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metrica, {
					rotulo: "Margem média",
					valor: `${percentual.toFixed(1)}%`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metrica, {
					rotulo: "Pedidos",
					valor: String(pedidos.length)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-6 lg:grid-cols-[1fr_320px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Últimos pedidos" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "space-y-3",
				children: pedidos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Nenhum pedido ainda. Comece cadastrando ingredientes e receitas."
				}) : [...pedidos].sort((a, b) => b.id - a.id).slice(0, 6).map((p) => {
					const cliente = clientes.find((c) => c.id === p.clienteId);
					const bolo = bolos.find((b) => b.id === p.boloId);
					const cobertura = coberturas.find((c) => c.id === p.coberturaId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: cliente?.nome ?? "Cliente removido"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								bolo?.nome ?? "—",
								" · ",
								cobertura?.nome ?? "Sem cobertura",
								" ·",
								" ",
								dataBR(p.data)
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-lg text-primary",
							children: brl((bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0))
						})]
					}, p.id);
				})
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Cadastros" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "space-y-2",
				children: atalhos.map(({ to, label, icon: Icon }) => {
					const totais = {
						"/ingredientes": ingredientes.length,
						"/bolos": bolos.length,
						"/coberturas": coberturas.length,
						"/clientes": clientes.length,
						"/pedidos": pedidos.length
					};
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to,
						className: "flex items-center justify-between rounded-xl border border-border px-4 py-3 transition-colors hover:bg-secondary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-accent" }), label]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: totais[to] ?? 0
						})]
					}, to);
				})
			})] })]
		})]
	});
}
function Metrica({ rotulo, valor }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "label-caps",
			children: rotulo
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-2xl text-primary",
			children: valor
		})]
	});
}
//#endregion
export { Painel as component };
