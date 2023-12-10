import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  ICredentialDataDecryptedObject,
} from "n8n-workflow";
import { Method } from "axios";
import axios from "axios";

export type FieldsUiValues = Array<{
  fieldId: string;
  fieldValue: string;
}>;

export class Powerlink implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Powerlink",
    name: "powerlink",
    icon: "file:powerlink.svg",
    group: ["transform"],
    version: 1,
    subtitle: "0.1.11",
    description: "Get data from Powerlink API",
    defaults: {
      name: "Powerlink",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "powerlinkApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Action",
        name: "action",
        type: "options",
        options: [
          {
            name: "Add Comment",
            value: "addComment",
          },
          {
            name: "Add Record",
            value: "addRecord",
          },
          {
            name: "Add Task",
            value: "addTask",
          },
          {
            name: "Delete Record",
            value: "deleteRecord",
          },
          {
            name: "Query",
            value: "query",
          },
          {
            name: "Update Record",
            value: "updateRecord",
          },
        ],
        default: "query",
      },
      {
        displayName: "Object Type",
        name: "objectType",
        type: "number",
        default: 1,
        required: true,
        displayOptions: {
          show: {
            action: [
              "addTask",
              "addComment",
              "addRecord",
              "deleteRecord",
              "updateRecord",
              "query",
            ],
          },
        },
        description: "Enter the integer value for Object Type",
      },
      {
        displayName: "Object ID",
        name: "objectId",
        type: "string",
        required: true,
        default: "",
        displayOptions: {
          show: {
            action: ["addTask", "addComment", "deleteRecord", "updateRecord"],
          },
        },
        description: "Enter the integer value for Object Type",
      },
      {
        displayName: "Page Size",
        name: "pageSize",
        type: "number",
        default: 500,
        displayOptions: {
          show: {
            action: ["query"],
          },
        },
        description: "Enter the integer value for Page Size",
      },
      {
        displayName: "Page Number",
        name: "pageNumber",
        type: "number",
        default: 1,
        displayOptions: {
          show: {
            action: ["query"],
          },
        },
        description: "Enter the integer value for Page Number",
      },
      {
        displayName: "Sort By",
        name: "sortBy",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            action: ["query"],
          },
        },
        description: "Enter the field to sort by",
      },
      {
        displayName: "Sort Type",
        name: "sortType",
        type: "string",
        default: "ASC",
        displayOptions: {
          show: {
            action: ["query"],
          },
        },
        description: "Enter the sort type (e.g., ASC or DESC)",
      },
      {
        displayName: "Fields",
        name: "fields",
        type: "string",
        default: "*",
        displayOptions: {
          show: {
            action: ["query"],
          },
        },
        description:
          "Enter the fields to retrieve (comma-separated). Use * for all fields.",
      },
      {
        displayName: "Message",
        name: "message",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            action: ["addTask", "addComment"],
          },
        },
        description: "Enter a comment to be added to the record",
      },
      {
        displayName: "Owner ID",
        name: "ownerid",
        type: "string",
        description: "The ID of the powerlink user agent, to act as the task reporter",
        default: "",
        required: true,
        displayOptions: {
          show: {
            action: ["addTask"],
          },
        },
      },
      {
        displayName: "Query Parameters",
        name: "fieldsUi",
        placeholder: "Add Field",
        type: "fixedCollection",
        description:
          "Field must be defined in the collection, otherwise it will be ignored. If field defined in the collection is not set here, it will be set to null.",
        typeOptions: {
          multipleValueButtonText: "Add Field to Send",
          multipleValues: true,
        },
        default: {},
        options: [
          {
            displayName: "Field",
            name: "fieldValues",
            values: [
              {
                displayName: "Field ID",
                name: "fieldId",
                type: "string",
                default: "",
              },
              {
                displayName: "Field Value",
                name: "fieldValue",
                type: "string",
                default: "",
              },
            ],
          },
        ],
      },
      {
        displayName: "Options",
        name: "toggleHideColumns",
        description: "Whether Should return only the data without columns",
        type: "boolean",
        default: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const baseURL = "https://api.powerlink.co.il/api";
    const action = this.getNodeParameter("action", 0) as string;
    const objectType = this.getNodeParameter("objectType", 0) as number;
    const objectId = this.getNodeParameter("objectId", 0, "") as string;
    const toggleHideColumns = this.getNodeParameter(
      "toggleHideColumns",
      0
    ) as boolean;
    const message = this.getNodeParameter("message", 0, "") as string;
    const credentials = await this.getCredentials("powerlinkApi");
    const queryParams = this.getNodeParameter(
      "fieldsUi.fieldValues",
      0,
      ""
    ) as FieldsUiValues;

    let responseData: any;
    let request: any;

    try {
      switch (action) {
        case "addTask":
          const ownerid = this.getNodeParameter("ownerid", 0, '') as string;
          request = handleAddTask(
            `${baseURL}/v2/record/10`,
              ownerid,
              objectType,
              objectId,
              message,
              credentials
          );
          responseData = (await request).data;
          break;
        case "addComment":
          request = handleAddComment(
            `${baseURL}/v2/record/${objectType}/${objectId}/Note`,
            message,
            credentials
          );
          responseData = (await request).data;
          break;
        case "addRecord":
          request = handleRecordManipulation(
            `${baseURL}/record/${objectType}`,
            "POST",
            queryParams,
            credentials
          );
          responseData = (await request).data;
          break;
        case "deleteRecord":
          request = axios({
            method: "DELETE",
            url: `${baseURL}/record/${objectType}/${objectId}`,
            headers: { tokenid: `${credentials.apiKey}` },
          });
          responseData = (await request).data;
          break;
        case "updateRecord":
          request = handleRecordManipulation(
            `${baseURL}/record/${objectType}/${objectId}`,
            "PUT",
            queryParams,
            credentials
          );
          responseData = (await request).data;
          break;
        case "query":
          const pageSize = this.getNodeParameter("pageSize", 0) as number;
          const pageNumber = this.getNodeParameter("pageNumber", 0) as number;
          const sortBy = this.getNodeParameter("sortBy", 0) as string;
          const sortType = this.getNodeParameter("sortType", 0) as string;
          const fields = this.getNodeParameter("fields", 0) as string;

          request = handleQuery(
            `${baseURL}/query`,
            objectType,
            pageSize,
            pageNumber,
            sortBy,
            sortType,
            fields,
            queryParams,
            credentials
          );

          responseData = (await request).data;
          responseData = toggleHideColumns
            ? responseData.data.Data
            : responseData;
          break;
      }
      console.log(toggleHideColumns);
      const outputData = [{ json: responseData }];
      return this.prepareOutputData(outputData);
    } catch (error) {
      console.error(
        `Error making ${action} request to Powerlink API:`,
        error.message
      );
      throw error;
    }

    function handleAddComment(
      url: string,
      message: string,
      credentials: ICredentialDataDecryptedObject
    ) {
      const dictionary: { [key: string]: string } = {
        notetext: `<span>${message}</span>`,
        notetype: "note",
      };

      return axios({
        method: "POST",
        url: url,
        data: JSON.stringify(dictionary),
        headers: { tokenid: `${credentials.apiKey}` },
      });
    }

    function handleAddTask(
      url: string,
      ownerid: string,
      objectType: number,
      objectId: string,
      message: string,
      credentials: ICredentialDataDecryptedObject
    ) {
      const dictionary: { [key: string]: any } = {
        ownerid: ownerid,
        scheduledend: new Date(),
        subject: message,
        objectid: objectId,
        objecttypecode: objectType,
      };

      return axios({
        method: "POST",
        url: url,
        data: JSON.stringify(dictionary),
        headers: { tokenid: `${credentials.apiKey}` },
      });
    }

    function handleRecordManipulation(
      url: string,
      method: Method,
      queryParameters: FieldsUiValues,
      credentials: ICredentialDataDecryptedObject
    ) {
      const dictionary: { [key: string]: string } = {};
      if (queryParameters && queryParameters.length > 0) {
        queryParameters.forEach((value) => {
          dictionary[value.fieldId] = value.fieldValue;
        });
      }

      return axios({
        method: method,
        url: url,
        data: JSON.stringify(dictionary),
        headers: { tokenid: `${credentials.apiKey}` },
      });
    }

    function handleQuery(
      url: string,
      objectType: number,
      pageSize: number,
      pageNumber: number,
      sortBy: string,
      sortType: string,
      fields: string,
      queryParameters: FieldsUiValues,
      credentials: ICredentialDataDecryptedObject
    ) {
      const jsonPayload: { [key: string]: any } = {
        objecttype: objectType,
        page_size: pageSize,
        page_number: pageNumber,
        fields: fields,
        sort_by: sortBy,
        sort_type: sortType,
      };

      if (queryParameters.length > 0) {
        const parametersArray = queryParameters.map((x) => {
          return `(${x.fieldId} = ${x.fieldValue})`;
        });
        jsonPayload["query"] = `${parametersArray.join(" AND ")}`;
      }

      return axios.post(url, JSON.stringify(jsonPayload), {
        headers: { tokenid: `${credentials.apiKey}` },
      });
    }
  }
}
