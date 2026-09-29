import { useMutation } from '@tanstack/react-query';
import { lookupCep } from '../lib/location';

/** Consulta o CEP (endereço e coordenadas) quando a pessoa termina de digitar. */
export const useCepLookup = () => useMutation({ mutationFn: lookupCep });
