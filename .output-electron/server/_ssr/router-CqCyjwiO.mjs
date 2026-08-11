import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { c as Layers, l as House, m as Cake, n as Wheat, r as Users, u as ClipboardList } from "../_libs/lucide-react.mjs";
import { _ as useRouter, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, l as useRouterState, m as createFileRoute, p as lazyRouteComponent, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CqCyjwiO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BbuCaVHz.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
var links = [
	{
		to: "/",
		label: "Painel",
		icon: House
	},
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
function AppNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-vintage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg",
						children: "AB"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "leading-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl text-primary",
						children: "Amor de Brigadeiro"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Gestão de bolos, receitas e pedidos"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex flex-wrap gap-1.5",
				children: links.map(({ to, label, icon: Icon }) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to,
						className: ["inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors", (to === "/" ? pathname === "/" : pathname.startsWith(to)) ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"].join(" "),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }), label]
					}, to);
				})
			})]
		})
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$6 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Amor de Brigadeiro | Gestão da confeitaria" },
			{
				name: "description",
				content: "Sistema de gestão da Amor de Brigadeiro: ingredientes, receitas, clientes, pedidos e custos."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$6.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppNav, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
				richColors: true,
				position: "top-right"
			})
		]
	});
}
var $$splitComponentImporter$5 = () => import("./routes-WtKCvGeV.mjs");
var Route$5 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Amor de Brigadeiro | Gestão da confeitaria" },
		{
			name: "description",
			content: "Painel de gestão da Amor de Brigadeiro: ingredientes, receitas de bolos e coberturas, clientes, pedidos e custos de produção."
		},
		{
			property: "og:title",
			content: "Amor de Brigadeiro | Gestão da confeitaria"
		},
		{
			property: "og:description",
			content: "Sistema completo para gerenciar ingredientes, receitas, clientes, pedidos e custos de produção."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./bolos-CH0PoLwS.mjs");
var Route$4 = createFileRoute("/bolos")({
	head: () => ({ meta: [
		{ title: "Bolos | Amor de Brigadeiro" },
		{
			name: "description",
			content: "Monte receitas de bolos com até 10 ingredientes e veja o custo de produção e a margem calculados na hora."
		},
		{
			property: "og:title",
			content: "Bolos | Amor de Brigadeiro"
		},
		{
			property: "og:description",
			content: "Receitas de bolos com cálculo automático de custo, preço de venda e lucro."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./clientes-4LUxJETz.mjs");
var Route$3 = createFileRoute("/clientes")({
	head: () => ({ meta: [
		{ title: "Clientes | Amor de Brigadeiro" },
		{
			name: "description",
			content: "Cadastro de clientes com nome e WhatsApp para agilizar o atendimento e os pedidos."
		},
		{
			property: "og:title",
			content: "Clientes | Amor de Brigadeiro"
		},
		{
			property: "og:description",
			content: "Lista de clientes da confeitaria com contato direto por WhatsApp."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./coberturas-DaC5_B-F.mjs");
var Route$2 = createFileRoute("/coberturas")({
	head: () => ({ meta: [
		{ title: "Coberturas | Amor de Brigadeiro" },
		{
			name: "description",
			content: "Cadastre coberturas com até 10 ingredientes e acompanhe custo de produção, preço e lucro por receita."
		},
		{
			property: "og:title",
			content: "Coberturas | Amor de Brigadeiro"
		},
		{
			property: "og:description",
			content: "Receitas de coberturas e recheios com custo calculado automaticamente."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./ingredientes-B3H4hnR9.mjs");
var Route$1 = createFileRoute("/ingredientes")({
	head: () => ({ meta: [
		{ title: "Ingredientes | Amor de Brigadeiro" },
		{
			name: "description",
			content: "Cadastre ingredientes com unidade e custo unitário para calcular o custo de produção dos bolos."
		},
		{
			property: "og:title",
			content: "Ingredientes | Amor de Brigadeiro"
		},
		{
			property: "og:description",
			content: "Controle de insumos, unidades e custos unitários da confeitaria."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./pedidos-Ci15sWqS.mjs");
var Route = createFileRoute("/pedidos")({
	head: () => ({ meta: [
		{ title: "Pedidos | Amor de Brigadeiro" },
		{
			name: "description",
			content: "Registre pedidos ligando cliente, bolo e cobertura, com custo e preço total calculados automaticamente."
		},
		{
			property: "og:title",
			content: "Pedidos | Amor de Brigadeiro"
		},
		{
			property: "og:description",
			content: "Controle de pedidos da confeitaria com totais de custo e venda."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$5.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$6
	}),
	BolosRoute: Route$4.update({
		id: "/bolos",
		path: "/bolos",
		getParentRoute: () => Route$6
	}),
	ClientesRoute: Route$3.update({
		id: "/clientes",
		path: "/clientes",
		getParentRoute: () => Route$6
	}),
	CoberturasRoute: Route$2.update({
		id: "/coberturas",
		path: "/coberturas",
		getParentRoute: () => Route$6
	}),
	IngredientesRoute: Route$1.update({
		id: "/ingredientes",
		path: "/ingredientes",
		getParentRoute: () => Route$6
	}),
	PedidosRoute: Route.update({
		id: "/pedidos",
		path: "/pedidos",
		getParentRoute: () => Route$6
	})
};
var routeTree = Route$6._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
