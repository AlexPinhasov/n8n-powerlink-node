import {
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class PowerlinkApi implements ICredentialType {
  name = "powerlinkApi";
  displayName = "Powerlink API";
  icon = 'file:powerlink.svg';
  documentationUrl =
    "https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/";
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
    },
  ];
}
