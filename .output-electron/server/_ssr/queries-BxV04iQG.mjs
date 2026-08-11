import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { a as stringType, i as objectType, n as coerce, r as enumType, t as arrayType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/queries-BxV04iQG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PageShell({ title, subtitle, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-8 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl text-primary sm:text-4xl",
				children: title
			}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: subtitle
			}) : null]
		}), children]
	});
}
function EmptyState({ message }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground",
		children: message
	});
}
function FieldError({ message }) {
	if (!message) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 text-xs font-semibold text-destructive",
		children: message
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var UNIDADES = [
	"kg",
	"g",
	"l",
	"ml",
	"unidade"
];
var ingredienteSchema = objectType({
	nome: stringType().trim().min(2, "Informe o nome do ingrediente").max(80),
	unidade: enumType(UNIDADES),
	custoUnitario: coerce.number({ invalid_type_error: "Informe um número" }).positive("O custo deve ser maior que zero").max(1e6)
});
var itemReceitaSchema = objectType({
	ingredienteId: coerce.number().int().positive("Selecione um ingrediente"),
	quantidade: coerce.number({ invalid_type_error: "Informe um número" }).positive("A quantidade deve ser maior que zero")
});
var receitaSchema = objectType({
	nome: stringType().trim().min(2, "Informe o nome").max(80),
	precoVenda: coerce.number({ invalid_type_error: "Informe um número" }).nonnegative("O preço não pode ser negativo").max(1e6),
	itens: arrayType(itemReceitaSchema).min(1, "Adicione pelo menos 1 ingrediente").max(10, `Máximo de 10 ingredientes`).refine((itens) => new Set(itens.map((i) => i.ingredienteId)).size === itens.length, "Não repita o mesmo ingrediente")
});
var clienteSchema = objectType({
	nome: stringType().trim().min(2, "Informe o nome do cliente").max(80),
	whatsapp: stringType().trim().min(10, "Informe o WhatsApp com DDD").max(20).regex(/^[0-9()+\-\s]+$/, "Use apenas números, espaços, ( ) + -")
});
var pedidoSchema = objectType({
	clienteId: coerce.number().int().positive("Selecione um cliente"),
	boloId: coerce.number().int().positive("Selecione um bolo"),
	coberturaId: coerce.number().int().positive().nullable(),
	data: stringType().min(4, "Informe a data do pedido")
});
/** Custo de produção = soma(quantidade × custo unitário do ingrediente). */
function calcularCusto(itens, ingredientes) {
	const porId = new Map(ingredientes.map((i) => [i.id, i]));
	const total = itens.reduce((acc, item) => {
		const ing = porId.get(item.ingredienteId);
		return acc + (ing ? ing.custoUnitario * item.quantidade : 0);
	}, 0);
	return Math.round(total * 100) / 100;
}
function margem(precoVenda, custo) {
	const lucro = Math.round((precoVenda - custo) * 100) / 100;
	return {
		lucro,
		percentual: precoVenda > 0 ? lucro / precoVenda * 100 : 0
	};
}
var brl = (v) => v.toLocaleString("pt-BR", {
	style: "currency",
	currency: "BRL"
});
var dataBR = (iso) => {
	const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
	return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
};
var hojeISO = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
var KEY = "amor-de-brigadeiro:db:v1";
function seed() {
	return {
		ingredientes: [
			{
				id: 1,
				nome: "Leite condensado",
				unidade: "unidade",
				custoUnitario: 6.5
			},
			{
				id: 2,
				nome: "Chocolate em pó",
				unidade: "kg",
				custoUnitario: 28
			},
			{
				id: 3,
				nome: "Farinha de trigo",
				unidade: "kg",
				custoUnitario: 5.2
			},
			{
				id: 4,
				nome: "Ovos",
				unidade: "unidade",
				custoUnitario: .85
			},
			{
				id: 5,
				nome: "Manteiga",
				unidade: "kg",
				custoUnitario: 42
			},
			{
				id: 6,
				nome: "Açúcar",
				unidade: "kg",
				custoUnitario: 4.4
			},
			{
				id: 7,
				nome: "Creme de leite",
				unidade: "unidade",
				custoUnitario: 3.9
			}
		],
		bolos: [{
			id: 1,
			nome: "Bolo de Chocolate Clássico",
			precoVenda: 95,
			criadoEm: hojeISO(),
			itens: [
				{
					ingredienteId: 3,
					quantidade: .5
				},
				{
					ingredienteId: 2,
					quantidade: .2
				},
				{
					ingredienteId: 4,
					quantidade: 4
				},
				{
					ingredienteId: 6,
					quantidade: .3
				},
				{
					ingredienteId: 5,
					quantidade: .15
				}
			]
		}],
		coberturas: [{
			id: 1,
			nome: "Brigadeiro Cremoso",
			precoVenda: 35,
			criadoEm: hojeISO(),
			itens: [
				{
					ingredienteId: 1,
					quantidade: 2
				},
				{
					ingredienteId: 2,
					quantidade: .1
				},
				{
					ingredienteId: 7,
					quantidade: 1
				}
			]
		}],
		clientes: [{
			id: 1,
			nome: "Marina Souza",
			whatsapp: "(11) 98888-1234"
		}],
		pedidos: [{
			id: 1,
			clienteId: 1,
			boloId: 1,
			coberturaId: 1,
			data: hojeISO()
		}],
		seq: {
			ingredientes: 7,
			bolos: 1,
			coberturas: 1,
			clientes: 1,
			pedidos: 1
		}
	};
}
function readDB() {
	if (typeof window === "undefined") return seed();
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) {
			const fresh = seed();
			window.localStorage.setItem(KEY, JSON.stringify(fresh));
			return fresh;
		}
		return JSON.parse(raw);
	} catch {
		return seed();
	}
}
function writeDB(db) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(KEY, JSON.stringify(db));
}
function nextId(db, table) {
	db.seq[table] = (db.seq[table] ?? 0) + 1;
	return db.seq[table];
}
/**
* Cliente de dados único para toda a aplicação.
*
* - No executável Windows, `window.AMOR_API_BASE` é injetado pelo Electron e
*   as chamadas vão para a API Express (Node + SQLite).
* - No navegador/preview, usa a persistência local (localStorage).
*
* As telas nunca conversam com o armazenamento diretamente — sempre por aqui.
*/
var ApiError = class extends Error {};
function apiBase() {
	if (typeof window === "undefined") return null;
	return window.AMOR_API_BASE ?? null;
}
async function http(path, init) {
	const base = apiBase();
	const res = await fetch(`${base}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...init?.headers ?? {}
		}
	});
	if (!res.ok) throw new ApiError((await res.json().catch(() => ({}))).error ?? `Falha na requisição (${res.status})`);
	return res.status === 204 ? void 0 : await res.json();
}
function mutate(fn) {
	const db = readDB();
	const result = fn(db);
	writeDB(db);
	return result;
}
function assertReceita(db, input) {
	if (input.itens.length > 10) throw new ApiError(`Máximo de 10 ingredientes.`);
	const ids = input.itens.map((i) => i.ingredienteId);
	if (new Set(ids).size !== ids.length) throw new ApiError("Ingredientes repetidos.");
	for (const id of ids) if (!db.ingredientes.some((i) => i.id === id)) throw new ApiError("Ingrediente inexistente.");
}
var ingredientesApi = {
	list: async () => apiBase() ? http("/ingredientes") : readDB().ingredientes,
	create: async (input) => apiBase() ? http("/ingredientes", {
		method: "POST",
		body: JSON.stringify(input)
	}) : mutate((db) => {
		const item = {
			id: nextId(db, "ingredientes"),
			...input
		};
		db.ingredientes.push(item);
		return item;
	}),
	update: async (id, input) => apiBase() ? http(`/ingredientes/${id}`, {
		method: "PUT",
		body: JSON.stringify(input)
	}) : mutate((db) => {
		const idx = db.ingredientes.findIndex((i) => i.id === id);
		if (idx < 0) throw new ApiError("Ingrediente não encontrado.");
		db.ingredientes[idx] = {
			id,
			...input
		};
		return db.ingredientes[idx];
	}),
	remove: async (id) => {
		if (apiBase()) return http(`/ingredientes/${id}`, { method: "DELETE" });
		mutate((db) => {
			if ([...db.bolos, ...db.coberturas].some((r) => r.itens.some((i) => i.ingredienteId === id))) throw new ApiError("Ingrediente em uso em um bolo ou cobertura.");
			db.ingredientes = db.ingredientes.filter((i) => i.id !== id);
		});
	}
};
function receitasApi(tabela) {
	const path = `/${tabela}`;
	return {
		list: async () => apiBase() ? http(path) : readDB()[tabela],
		create: async (input) => apiBase() ? http(path, {
			method: "POST",
			body: JSON.stringify(input)
		}) : mutate((db) => {
			assertReceita(db, input);
			const item = {
				id: nextId(db, tabela),
				nome: input.nome,
				precoVenda: input.precoVenda,
				criadoEm: hojeISO(),
				itens: input.itens
			};
			db[tabela].push(item);
			return item;
		}),
		update: async (id, input) => apiBase() ? http(`${path}/${id}`, {
			method: "PUT",
			body: JSON.stringify(input)
		}) : mutate((db) => {
			assertReceita(db, input);
			const atual = db[tabela].find((r) => r.id === id);
			if (!atual) throw new ApiError("Registro não encontrado.");
			Object.assign(atual, {
				nome: input.nome,
				precoVenda: input.precoVenda,
				itens: input.itens
			});
			return atual;
		}),
		remove: async (id) => {
			if (apiBase()) return http(`${path}/${id}`, { method: "DELETE" });
			mutate((db) => {
				if (db.pedidos.some((p) => tabela === "bolos" ? p.boloId === id : p.coberturaId === id)) throw new ApiError("Registro vinculado a um pedido.");
				db[tabela] = db[tabela].filter((r) => r.id !== id);
			});
		}
	};
}
var bolosApi = receitasApi("bolos");
var coberturasApi = receitasApi("coberturas");
var clientesApi = {
	list: async () => apiBase() ? http("/clientes") : readDB().clientes,
	create: async (input) => apiBase() ? http("/clientes", {
		method: "POST",
		body: JSON.stringify(input)
	}) : mutate((db) => {
		const item = {
			id: nextId(db, "clientes"),
			...input
		};
		db.clientes.push(item);
		return item;
	}),
	update: async (id, input) => apiBase() ? http(`/clientes/${id}`, {
		method: "PUT",
		body: JSON.stringify(input)
	}) : mutate((db) => {
		const idx = db.clientes.findIndex((c) => c.id === id);
		if (idx < 0) throw new ApiError("Cliente não encontrado.");
		db.clientes[idx] = {
			id,
			...input
		};
		return db.clientes[idx];
	}),
	remove: async (id) => {
		if (apiBase()) return http(`/clientes/${id}`, { method: "DELETE" });
		mutate((db) => {
			if (db.pedidos.some((p) => p.clienteId === id)) throw new ApiError("Cliente possui pedidos registrados.");
			db.clientes = db.clientes.filter((c) => c.id !== id);
		});
	}
};
var pedidosApi = {
	list: async () => apiBase() ? http("/pedidos") : readDB().pedidos,
	create: async (input) => apiBase() ? http("/pedidos", {
		method: "POST",
		body: JSON.stringify(input)
	}) : mutate((db) => {
		const item = {
			id: nextId(db, "pedidos"),
			...input
		};
		db.pedidos.push(item);
		return item;
	}),
	update: async (id, input) => apiBase() ? http(`/pedidos/${id}`, {
		method: "PUT",
		body: JSON.stringify(input)
	}) : mutate((db) => {
		const idx = db.pedidos.findIndex((p) => p.id === id);
		if (idx < 0) throw new ApiError("Pedido não encontrado.");
		db.pedidos[idx] = {
			id,
			...input
		};
		return db.pedidos[idx];
	}),
	remove: async (id) => {
		if (apiBase()) return http(`/pedidos/${id}`, { method: "DELETE" });
		mutate((db) => {
			db.pedidos = db.pedidos.filter((p) => p.id !== id);
		});
	}
};
var keys = {
	ingredientes: ["ingredientes"],
	bolos: ["bolos"],
	coberturas: ["coberturas"],
	clientes: ["clientes"],
	pedidos: ["pedidos"]
};
var useIngredientes = () => useQuery({
	queryKey: keys.ingredientes,
	queryFn: ingredientesApi.list
});
var useBolos = () => useQuery({
	queryKey: keys.bolos,
	queryFn: bolosApi.list
});
var useCoberturas = () => useQuery({
	queryKey: keys.coberturas,
	queryFn: coberturasApi.list
});
var useClientes = () => useQuery({
	queryKey: keys.clientes,
	queryFn: clientesApi.list
});
var usePedidos = () => useQuery({
	queryKey: keys.pedidos,
	queryFn: pedidosApi.list
});
/** Mutação com feedback visual padronizado (sucesso/erro) e invalidação. */
function useAppMutation(options) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: options.mutationFn,
		onSuccess: async () => {
			await Promise.all(options.invalidate.map((key) => qc.invalidateQueries({ queryKey: key })));
			toast.success(options.successMessage);
			options.onSuccess?.();
		},
		onError: (error) => {
			toast.error(error.message || "Não foi possível concluir a operação.");
		}
	});
}
//#endregion
export { usePedidos as A, pedidosApi as C, useClientes as D, useBolos as E, useCoberturas as O, pedidoSchema as S, useAppMutation as T, hojeISO as _, EmptyState as a, keys as b, UNIDADES as c, calcularCusto as d, clienteSchema as f, dataBR as g, coberturasApi as h, CardTitle as i, useIngredientes as k, bolosApi as l, cn as m, CardContent as n, FieldError as o, clientesApi as p, CardHeader as r, PageShell as s, Card as t, brl as u, ingredienteSchema as v, receitaSchema as w, margem as x, ingredientesApi as y };
