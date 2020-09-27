# Maana AI GOAP 
This service provides a GraphQL interface for Goal Oriented Action Planning
(GOAP).   Goal oriented action planning is an artificial intelligence algorithm for 
planning a sequence of actions to satisfy a particular goal. The sequence of actions 
depends both upon the goal and the current state of the world and the agent
performing the actions.

# Building an Image
To build a docker image of this service, your repository must be in a pristine state (no uncommited changes).   You can start the build process by executing the following instructions from the command line: 
```
npm run docker-build
```
This will build the docker image and tag it with the sha of your current commit

# Testing Your Image
You can test the docker image that you built by executing the following instruction from the command line:
```
npm run docker-run
```
If you need to provide environment variables (e.g. for authentication), they can be placed in the .env file in this repository's root folder.   

!!! NOTE: If you add authentication secrets to the repository DO NOT CHECK IT IN !!!

# Publishing
You can publish the docker image that you built to the github package repository by issuing the following instructions from the command line:
```
npm run docker-push
```
Once completed, your docker image will be available in the GitHub packages in the [deployment repository](https://github.com/maana-io/goap-deployment)

# Updating the Deployment
Before you can deploy your newly built docker image, you will need to update the values.yaml file in the [deployment repository](https://github.com/maana-io/goap-deployment/blob/master/values.yaml) so that the value of the logic.version field matches the image tag of the docker image that you want to deploy.   You can also run the command below to get the git sha for the most recent commit:
```
git rev-parse --short HEAD
```

# Deployment
To deploy the GOAP Assistant and all its components, you can follow the instructions on the [deployment repository wiki](https://github.com/maana-io/goap-deployment/wiki/Deployment-Instructions).   For deployments to lkg, you can simply clone the deployment repository to your local machine and execute the following instruction from the command line from the root folder of that repository:
```
helm upgrade lkg-goap . -f cluster.yaml
```