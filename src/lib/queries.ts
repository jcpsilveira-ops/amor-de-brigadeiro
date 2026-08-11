import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bolosApi,
  clientesApi,
  coberturasApi,
  despesasApi,
  ingredientesApi,
  pedidosApi,
} from "./api";

export const keys = {
  ingredientes: ["ingredientes"] as QueryKey,
  bolos: ["bolos"] as QueryKey,
  coberturas: ["coberturas"] as QueryKey,
  clientes: ["clientes"] as QueryKey,
  pedidos: ["pedidos"] as QueryKey,
  despesas: ["outras_despesas"] as QueryKey,
};

export const useIngredientes = () =>
  useQuery({ queryKey: keys.ingredientes, queryFn: ingredientesApi.list });
export const useBolos = () => useQuery({ queryKey: keys.bolos, queryFn: bolosApi.list });
export const useCoberturas = () =>
  useQuery({ queryKey: keys.coberturas, queryFn: coberturasApi.list });
export const useClientes = () =>
  useQuery({ queryKey: keys.clientes, queryFn: clientesApi.list });
export const usePedidos = () =>
  useQuery({ queryKey: keys.pedidos, queryFn: pedidosApi.list });
export const useDespesas = () =>
  useQuery({ queryKey: keys.despesas, queryFn: despesasApi.list });

/** Mutação com feedback visual padronizado (sucesso/erro) e invalidação. */
export function useAppMutation<TInput>(options: {
  mutationFn: (input: TInput) => Promise<unknown>;
  invalidate: QueryKey[];
  successMessage: string;
  onSuccess?: () => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: async () => {
      await Promise.all(options.invalidate.map((key) => qc.invalidateQueries({ queryKey: key })));
      toast.success(options.successMessage);
      options.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível concluir a operação.");
    },
  });
}

export { bolosApi, clientesApi, coberturasApi, despesasApi, ingredientesApi, pedidosApi };
