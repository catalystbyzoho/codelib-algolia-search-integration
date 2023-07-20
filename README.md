# Algolia Search Integration

The Algolia Search Integration CodeLib helps you implement relevant search and discovery in your Catalyst application using Algolia's hosted APIs.

**Note:** You can get more detailed information on the steps to install and configure the Algolia Search Integration CodeLib from your Catalyst console. You must navigate to the bottom of your Catalyst console where you will find the _Catalyst CodeLibs_ section. You can click on the **Algolia Search Integration** **CodeLib** tile to access the steps.

**How does the CodeLib work?**

Upon installing this CodeLib, pre-defined Catalyst components specific to the CodeLib will be configured in your project. This includes three [Catalyst Serverless functions](https://docs.catalyst.zoho.com/en/serverless/help/functions/introduction/) (one [Advanced I/O](https://docs.catalyst.zoho.com/en/serverless/help/functions/advanced-io/) and two [Event](https://docs.catalyst.zoho.com/en/serverless/help/functions/event-functions/) functions) in Node.js, a rule in the [Catalyst Cloud Scale Event Listener](https://docs.catalyst.zoho.com/en/cloud-scale/help/event-listeners/introduction/) component and also a cache segment in the [Catalyst Cloud Scale Cache](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/introduction/) component.

We have implemented Algolia's SDK package that offers support for basic indexing and searching operations in this CodeLib. Algolia implements authentication using an unique **API key**. You can fetch your auto-generated Admin API key from [this](https://www.algolia.com/account/api-keys) page. You will need to configure this Admin API key and your Algolia **[application ID](https://support.algolia.com/hc/en-us/articles/11040113398673-Where-can-I-find-my-application-ID-and-the-index-name-)** in the **catalyst-config.json** files of all three functions. The **algolia_search_integration** function will require you to configure an extra key named the **CODELIB_SECRET_KEY** which will be passed in the request header of the _cURL_ request every time you try to access any endpoints of the pre-configured functions in the CodeLib. This key allows you to access the Catalyst resources of the CodeLib securely.

Firstly, the data that has to be made searchable in your application has to be sent from Catalyst Data Store table to the Algolia's servers. For this, you can invoke the **/bulkIndex** endpoint configured in the **algolia_search_integration** function **([Advanced I/O](https://docs.catalyst.zoho.com/en/serverless/help/functions/advanced-io/)).** The Data Store table name is passed in the request payload while invoking this endpoint. Then, the table metadata is inserted as an entry into the pre-configured cache segment( **Algolia**).

An Event Listener rule is configured such that whenever a data insertion event takes place in the cache segment , the corresponding event function **algolia_search_bulk_index_handler** is invoked. This function first converts the table data to JSON records to make it understandable by Algolia. These JSON records are pushed in bulk to Algolia, where it gets stored in an index. An **_Algolia index_** is a placeholder location hosted on its servers to store the data sent from any third-party application. The index is well-optimized for relevant search and discovery operations. For creating an Algolia index for your project, you can refer to [this](https://www.algolia.com/doc/api-client/methods/indexing/#creating-indices) page. You must make sure to configure the Algolia index with the same name as that of your Catalyst Data Store table.

The **algolia_search_record_handler([Event](https://docs.catalyst.zoho.com/en/serverless/help/functions/event-functions/))** function handles the logic to maintain a sync between the data in the Data Store and the copy of data stored in the Algolia servers. Whenever you perform an add, delete, or modify operation in the Data Store, this event function is invoked automatically to update the changes in the copy of the data in Algolia servers. You will need to configure an event rule in the Catalyst Event Listener by specifying the required Datastore table and this event function as target to achieve a real time sync between your table and Algolia index.

Once you have pushed your application's data to Algolia, you are all set to perform searches in your application. When the user needs to perform a search operation in your Catalyst application, you can invoke the **/search** endpoint configured in the **algolia_search_integration** function. You need to pass the Catalyst table name and the search query in the request payload while triggering this endpoint. Algolia handles the search entirely from its end and returns the search response back to your Catalyst application.

**Note:**

- Algolia performs search only with the copy of the data that is sent to its servers, and not on your application's original data source.
- The Catalyst resources pre-configured as a part of the CodeLib are not subject to HIPPA complaints. If you are working with ePHI and other sensitive user data, we strongly recommend you to make use of [Catalyst&#39;s HIPAA compliance](https://catalyst.zoho.com/help/hipaa-compliance.html) support.

In cases when you need to send only a single row and not the entire table data to Algolia, you can execute the **/row** endpoint configured in the **algolia_search_integration** function. You will need to pass the specific row ID and table name as parameters in the request payload while invoking the endpoint. This will send the row data to Algolia and also perform indexing of that data.

**Note:** You can get more detailed information on the steps to install and configure the Algolia Search Integration CodeLib from the **_Catalyst CodeLib_** section in your Catalyst console.

**Resources Involved:**

The following Catalyst resources are auto-configured and used as a part of the Algolia Search Integration CodeLib.

**1. [Catalyst Cloud Scale Data Store](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/introduction/)** : Catalyst Data Store table stores the application data which is to be sent to Algolia, to make it searchable. You can perform search in Algolia by passing the name of that table and the search query in the request payload while invoking the endpoints configured **algolia_search_integration** function.

**2. [Catalyst Serverless Functions](https://docs.catalyst.zoho.com/en/serverless/help/functions/introduction/) :** The **algolia_search_integration([Advanced I/O function](https://docs.catalyst.zoho.com/en/serverless/help/functions/advanced-io/))** handles the logic to be executed to while the user performs a search operation **(/search)** in the Catalyst application. Based on the search query entered, Algolia performs the search with the copy of your application's data and returns the response back to your application. It also contains the definitions of two other routes **/bulkIndex** and **/row** that can be used to index bulk data or a single data row respectively.

The **algolia_search_bulk_index_handler([Event function](https://docs.catalyst.zoho.com/en/serverless/help/functions/event-functions/))** is automatically triggered whenever an entry is made in the cache segment (**Algolia**). This function contains the logic to convert the table data to JSON records and push them to Algolia.

The **algolia_search_record_handler([Event function](https://docs.catalyst.zoho.com/en/serverless/help/functions/event-functions/))** can be configured to execute whenever there is an addition, deletion or updation operation taking place in the Catalyst Data Store. This function handles the logic to maintain a sync between the data in the Data Store and the copy of data stored in the Algolia servers.

**3. [Catalyst Cloud Scale Event Listener](https://docs.catalyst.zoho.com/en/cloud-scale/help/event-listeners/introduction/) :** We will be configuring two rules in the Catalyst Event Listener. Whenever an entry is being made in the cache segment (**Algolia**) one of the pre-configured event rules triggers the **algolia_search_bulk_index_handler** function automatically. You should configure another rule manually to check for any data updates being made in the Data Store table, which in turn invokes the **algolia_search_record_handler** function.

**4. [Catalyst Cloud Scale Cache](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/introduction/) :** The cache segment(**Algolia**) is used to store the Data Store table metadata for frequent access, and is configured with an event to invoke the corresponding event function.
