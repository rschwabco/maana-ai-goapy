# Maana AI GOAP 
This service provides a GraphQL interface for Goal Oriented Action Planning
(GOAP).   Goal oriented action planning is an artificial intelligence algorithm for 
planning a sequence of actions to satisfy a particular goal. The sequence of actions 
depends both upon the goal and the current state of the world and the agent
performing the actions.

## Components
This service consists of a single component:

* `maana-ai-goap`: A Node based graphQL microservice that provides the logic for constructing rule based action plans and optimal goal 
  seeking.

If you wish to use the `Maana AI GOAP` service you will need to deploy the `maana-ai-goap` service and register it with the `Maana Q catalog` service.   

# Prerequisites
## Dependencies
The `Maana AI GOAP` service does not depend upon any other services.

## Tools
You must have docker and kubernetes command line tools,
the Maana Q command line tool, and you must be logged 
into your docker repository.   Links for installation of these tools are below:

[Maana CLI](https://www.npmjs.com/package/graphql-cli-maana)

[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

[Docker](https://docs.docker.com/get-docker/) 


# Setting the Environment Variables
Before you deploy you will need to configure the server use the correct
authentication method and endpoint for your Maana Q cluster. 
Rename the `.env.template` file in the root folder of this repository to `.env`, and populate the 
following environment variables with the details for your cluster:

```
CKG_ENDPOINT_URL=
REACT_APP_PORTAL_AUTH_DOMAIN=
REACT_APP_PORTAL_AUTH_CLIENT_ID=
REACT_APP_PORTAL_AUTH_CLIENT_SECRET=
REACT_APP_PORTAL_AUTH_IDENTIFIER=
REACT_APP_PORTAL_AUTH_PROVIDER=
```

# Deploying Maana-ai-goap Service
Deploy this service is using the mdeploy command:
```
gql mdeploy
```

When prompted, you should provide the following inputs:

```
? What is the service name? maana-ai-goap
? What is the path to the folder containing your Dockerfile? .
? How many pods would you like to spin up? 1
? What is the port your application is running on? 8050
```

NOTE After mdeploy is complete, take note of the endpoint URL that is returned. For example:
```
The URL for your GraphQL endpoint is
    http://1.2.3.4:8050/graphql
```

You will need this to register the service.

# Service Registration

After the service has been deployed, you will need to register it 
with the `Maana Q catalog` if you wish to use it with the Maana Q 
platform.   Log into the Maana Q Intelligence Designer and use the add service dialog in the 
services tab.  Use the details below when registring your service:

```
SERVICE NAME: Maana AI GOAP
SERVICE ID:   maana-ai-goap
SERVICE TYPE: GraphQL
ENDPOINT URL: **Endpoint URL from MDEPLOY**
```

For more information on how to register your service, consult 
the Q platform documentation:

[Service Registration](https://app.gitbook.com/@maana/s/q/training/developer/developer-steel-thread/deploy-and-use-your-service)
