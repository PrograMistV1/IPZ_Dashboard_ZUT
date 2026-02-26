// Bridge registry for compatibility
// Re-export named exports from components/widgets/registry.js
// and provide a default legacy export for code that imports the older module path.

import * as compRegistry from "../components/widgets/registry";

export const widgetTypes = compRegistry.widgetTypes;
export const widgetComponents = compRegistry.widgetComponents;
export const serverTypeMap = compRegistry.serverTypeMap;
export function getWidgetComponent(type, mode = "feed") {
  return compRegistry.getWidgetComponent(type, mode);
}
export function getComponentByServerType(serverType) {
  return compRegistry.getComponentByServerType(serverType);
}

// Legacy default export (some parts of app expect a registry/default map)
const legacy = {
  widgetTypes: compRegistry.widgetTypes,
  widgetComponents: compRegistry.widgetComponents,
  serverTypeMap: compRegistry.serverTypeMap,
  getWidgetComponent: compRegistry.getWidgetComponent,
  getComponentByServerType: compRegistry.getComponentByServerType,
};

export default legacy;

