import type { TExclude, TRequired } from '@cmtlyt/base';
import type { ToastMessageOptions, ToastServiceMethods } from 'primevue';
import { useToast } from 'primevue';

type ServiceKey = TRequired<ToastMessageOptions>['severity'];

type ServiceHandlerOptions = TExclude<ToastMessageOptions, 'severity'>;

type ServiceHandler = (option: ServiceHandlerOptions) => void;

type ClService = Record<ServiceKey, ServiceHandler> & ToastServiceMethods;

export function useClToast(defaultOptions?: ServiceHandlerOptions): ClService {
  const toast = useToast();

  const getOptions = (severity: ToastMessageOptions['severity'] = 'info', option: ServiceHandlerOptions) => {
    return {
      life: 3000,
      ...defaultOptions,
      ...option,
      severity,
    };
  };

  const service = computed(() => {
    return new Proxy<ClService>(toast as any, {
      get(target, prop, receiver) {
        if (prop in target)
          return Reflect.get(target, prop, receiver);
        return (option: ServiceHandlerOptions) => {
          const a = getOptions(prop as ToastMessageOptions['severity'], option);
          toast.add(a);
        };
      },
    });
  });

  return service.value;
}
