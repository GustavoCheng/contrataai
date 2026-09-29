import { useMutation } from '@tanstack/react-query';
import { lookupCep } from '../lib/location';

export const useCepLookup = () => useMutation({ mutationFn: lookupCep });
