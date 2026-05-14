import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { Alert, AlertInput, AlertSummary, Device, DeviceInput, DeviceUpdate, GeoTrafficEvent, GetTrafficGeoParams, HealthStatus, ListAlertsParams, ListTrafficParams, PortScanResult, Settings, SettingsUpdate, TestEmailResult, TrafficEvent, TrafficEventInput, TrafficSummary } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List traffic events with optional filters
 */
export declare const getListTrafficUrl: (params?: ListTrafficParams) => string;
export declare const listTraffic: (params?: ListTrafficParams, options?: RequestInit) => Promise<TrafficEvent[]>;
export declare const getListTrafficQueryKey: (params?: ListTrafficParams) => readonly ["/api/traffic", ...ListTrafficParams[]];
export declare const getListTrafficQueryOptions: <TData = Awaited<ReturnType<typeof listTraffic>>, TError = ErrorType<unknown>>(params?: ListTrafficParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTraffic>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTraffic>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTrafficQueryResult = NonNullable<Awaited<ReturnType<typeof listTraffic>>>;
export type ListTrafficQueryError = ErrorType<unknown>;
/**
 * @summary List traffic events with optional filters
 */
export declare function useListTraffic<TData = Awaited<ReturnType<typeof listTraffic>>, TError = ErrorType<unknown>>(params?: ListTrafficParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTraffic>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Record a new traffic event
 */
export declare const getCreateTrafficEventUrl: () => string;
export declare const createTrafficEvent: (trafficEventInput: TrafficEventInput, options?: RequestInit) => Promise<TrafficEvent>;
export declare const getCreateTrafficEventMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTrafficEvent>>, TError, {
        data: BodyType<TrafficEventInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTrafficEvent>>, TError, {
    data: BodyType<TrafficEventInput>;
}, TContext>;
export type CreateTrafficEventMutationResult = NonNullable<Awaited<ReturnType<typeof createTrafficEvent>>>;
export type CreateTrafficEventMutationBody = BodyType<TrafficEventInput>;
export type CreateTrafficEventMutationError = ErrorType<unknown>;
/**
 * @summary Record a new traffic event
 */
export declare const useCreateTrafficEvent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTrafficEvent>>, TError, {
        data: BodyType<TrafficEventInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTrafficEvent>>, TError, {
    data: BodyType<TrafficEventInput>;
}, TContext>;
/**
 * @summary Get aggregate traffic summary (totals, top devices, protocols)
 */
export declare const getGetTrafficSummaryUrl: () => string;
export declare const getTrafficSummary: (options?: RequestInit) => Promise<TrafficSummary>;
export declare const getGetTrafficSummaryQueryKey: () => readonly ["/api/traffic/summary"];
export declare const getGetTrafficSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getTrafficSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrafficSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTrafficSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTrafficSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getTrafficSummary>>>;
export type GetTrafficSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get aggregate traffic summary (totals, top devices, protocols)
 */
export declare function useGetTrafficSummary<TData = Awaited<ReturnType<typeof getTrafficSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrafficSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get traffic events with geo coordinates for world map
 */
export declare const getGetTrafficGeoUrl: (params?: GetTrafficGeoParams) => string;
export declare const getTrafficGeo: (params?: GetTrafficGeoParams, options?: RequestInit) => Promise<GeoTrafficEvent[]>;
export declare const getGetTrafficGeoQueryKey: (params?: GetTrafficGeoParams) => readonly ["/api/traffic/geo", ...GetTrafficGeoParams[]];
export declare const getGetTrafficGeoQueryOptions: <TData = Awaited<ReturnType<typeof getTrafficGeo>>, TError = ErrorType<unknown>>(params?: GetTrafficGeoParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrafficGeo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTrafficGeo>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTrafficGeoQueryResult = NonNullable<Awaited<ReturnType<typeof getTrafficGeo>>>;
export type GetTrafficGeoQueryError = ErrorType<unknown>;
/**
 * @summary Get traffic events with geo coordinates for world map
 */
export declare function useGetTrafficGeo<TData = Awaited<ReturnType<typeof getTrafficGeo>>, TError = ErrorType<unknown>>(params?: GetTrafficGeoParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrafficGeo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List security alerts
 */
export declare const getListAlertsUrl: (params?: ListAlertsParams) => string;
export declare const listAlerts: (params?: ListAlertsParams, options?: RequestInit) => Promise<Alert[]>;
export declare const getListAlertsQueryKey: (params?: ListAlertsParams) => readonly ["/api/alerts", ...ListAlertsParams[]];
export declare const getListAlertsQueryOptions: <TData = Awaited<ReturnType<typeof listAlerts>>, TError = ErrorType<unknown>>(params?: ListAlertsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAlerts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAlerts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAlertsQueryResult = NonNullable<Awaited<ReturnType<typeof listAlerts>>>;
export type ListAlertsQueryError = ErrorType<unknown>;
/**
 * @summary List security alerts
 */
export declare function useListAlerts<TData = Awaited<ReturnType<typeof listAlerts>>, TError = ErrorType<unknown>>(params?: ListAlertsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAlerts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new alert (used internally by monitoring engine)
 */
export declare const getCreateAlertUrl: () => string;
export declare const createAlert: (alertInput: AlertInput, options?: RequestInit) => Promise<Alert>;
export declare const getCreateAlertMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAlert>>, TError, {
        data: BodyType<AlertInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAlert>>, TError, {
    data: BodyType<AlertInput>;
}, TContext>;
export type CreateAlertMutationResult = NonNullable<Awaited<ReturnType<typeof createAlert>>>;
export type CreateAlertMutationBody = BodyType<AlertInput>;
export type CreateAlertMutationError = ErrorType<unknown>;
/**
 * @summary Create a new alert (used internally by monitoring engine)
 */
export declare const useCreateAlert: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAlert>>, TError, {
        data: BodyType<AlertInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAlert>>, TError, {
    data: BodyType<AlertInput>;
}, TContext>;
/**
 * @summary Mark an alert as resolved
 */
export declare const getResolveAlertUrl: (id: number) => string;
export declare const resolveAlert: (id: number, options?: RequestInit) => Promise<Alert>;
export declare const getResolveAlertMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resolveAlert>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resolveAlert>>, TError, {
    id: number;
}, TContext>;
export type ResolveAlertMutationResult = NonNullable<Awaited<ReturnType<typeof resolveAlert>>>;
export type ResolveAlertMutationError = ErrorType<unknown>;
/**
 * @summary Mark an alert as resolved
 */
export declare const useResolveAlert: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resolveAlert>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resolveAlert>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get counts of alerts by severity and recent unresolved
 */
export declare const getGetAlertSummaryUrl: () => string;
export declare const getAlertSummary: (options?: RequestInit) => Promise<AlertSummary>;
export declare const getGetAlertSummaryQueryKey: () => readonly ["/api/alerts/summary"];
export declare const getGetAlertSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getAlertSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAlertSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAlertSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAlertSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getAlertSummary>>>;
export type GetAlertSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get counts of alerts by severity and recent unresolved
 */
export declare function useGetAlertSummary<TData = Awaited<ReturnType<typeof getAlertSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAlertSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all known network devices with their bandwidth usage
 */
export declare const getListDevicesUrl: () => string;
export declare const listDevices: (options?: RequestInit) => Promise<Device[]>;
export declare const getListDevicesQueryKey: () => readonly ["/api/devices"];
export declare const getListDevicesQueryOptions: <TData = Awaited<ReturnType<typeof listDevices>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDevices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDevices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDevicesQueryResult = NonNullable<Awaited<ReturnType<typeof listDevices>>>;
export type ListDevicesQueryError = ErrorType<unknown>;
/**
 * @summary List all known network devices with their bandwidth usage
 */
export declare function useListDevices<TData = Awaited<ReturnType<typeof listDevices>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDevices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Register or update a device
 */
export declare const getCreateDeviceUrl: () => string;
export declare const createDevice: (deviceInput: DeviceInput, options?: RequestInit) => Promise<Device>;
export declare const getCreateDeviceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDevice>>, TError, {
        data: BodyType<DeviceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDevice>>, TError, {
    data: BodyType<DeviceInput>;
}, TContext>;
export type CreateDeviceMutationResult = NonNullable<Awaited<ReturnType<typeof createDevice>>>;
export type CreateDeviceMutationBody = BodyType<DeviceInput>;
export type CreateDeviceMutationError = ErrorType<unknown>;
/**
 * @summary Register or update a device
 */
export declare const useCreateDevice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDevice>>, TError, {
        data: BodyType<DeviceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDevice>>, TError, {
    data: BodyType<DeviceInput>;
}, TContext>;
/**
 * @summary Update device info (label, blocked status)
 */
export declare const getUpdateDeviceUrl: (id: number) => string;
export declare const updateDevice: (id: number, deviceUpdate: DeviceUpdate, options?: RequestInit) => Promise<Device>;
export declare const getUpdateDeviceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDevice>>, TError, {
        id: number;
        data: BodyType<DeviceUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDevice>>, TError, {
    id: number;
    data: BodyType<DeviceUpdate>;
}, TContext>;
export type UpdateDeviceMutationResult = NonNullable<Awaited<ReturnType<typeof updateDevice>>>;
export type UpdateDeviceMutationBody = BodyType<DeviceUpdate>;
export type UpdateDeviceMutationError = ErrorType<unknown>;
/**
 * @summary Update device info (label, blocked status)
 */
export declare const useUpdateDevice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDevice>>, TError, {
        id: number;
        data: BodyType<DeviceUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDevice>>, TError, {
    id: number;
    data: BodyType<DeviceUpdate>;
}, TContext>;
/**
 * @summary Get application settings (email, router config, thresholds)
 */
export declare const getGetSettingsUrl: () => string;
export declare const getSettings: (options?: RequestInit) => Promise<Settings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get application settings (email, router config, thresholds)
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update settings
 */
export declare const getUpdateSettingsUrl: () => string;
export declare const updateSettings: (settingsUpdate: SettingsUpdate, options?: RequestInit) => Promise<Settings>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SettingsUpdate>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<SettingsUpdate>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
 * @summary Update settings
 */
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SettingsUpdate>;
}, TContext>;
/**
 * @summary Send a test email alert
 */
export declare const getTestEmailAlertUrl: () => string;
export declare const testEmailAlert: (options?: RequestInit) => Promise<TestEmailResult>;
export declare const getTestEmailAlertMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof testEmailAlert>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof testEmailAlert>>, TError, void, TContext>;
export type TestEmailAlertMutationResult = NonNullable<Awaited<ReturnType<typeof testEmailAlert>>>;
export type TestEmailAlertMutationError = ErrorType<unknown>;
/**
 * @summary Send a test email alert
 */
export declare const useTestEmailAlert: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof testEmailAlert>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof testEmailAlert>>, TError, void, TContext>;
/**
 * @summary Get open port scan results for router/devices
 */
export declare const getScanPortsUrl: () => string;
export declare const scanPorts: (options?: RequestInit) => Promise<PortScanResult[]>;
export declare const getScanPortsQueryKey: () => readonly ["/api/ports/scan"];
export declare const getScanPortsQueryOptions: <TData = Awaited<ReturnType<typeof scanPorts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof scanPorts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof scanPorts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ScanPortsQueryResult = NonNullable<Awaited<ReturnType<typeof scanPorts>>>;
export type ScanPortsQueryError = ErrorType<unknown>;
/**
 * @summary Get open port scan results for router/devices
 */
export declare function useScanPorts<TData = Awaited<ReturnType<typeof scanPorts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof scanPorts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map