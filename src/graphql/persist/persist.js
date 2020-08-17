import { getService, addInstances, allInstances, deleteInstances } from './io'
import { flattenGoapModel } from './utils'
import { persistlogger } from '../common/types/constants'
const logger = persistlogger

/** Given a workspace ID and a model, persist the model to the workspace's
 * store.   May throw an error if the workspace is not a goap workspace,
 * if the model is ill formed, or if the model cannot be written.
 * @param args.workspaceId - the workspace to which the model will be written
 * @param args.svc - (Optional) A graphql client for a valid goap workspace.
 *   either the workspace ID or the svc must be provided.
 * @param args.model - the goap model input to write to the workspace.
 * @return True if the write is successful.
 */
async function persistModel(args) {
  // destructure the input and aggregate the instances to write.
  const instances = await flattenGoapModel(null, args)
  const svc = await getService(args)
  const modelId = args.workspaceId
  const TopLevelKinds = ['variables', 'goals', 'initialValues', 'transitions']
  const names = Object.keys(instances).filter(
    x => instances[x] && Array.isArray(instances[x]) && instances[x].length > 0
  )
  // Construct a dictionary object which contains all the information about the
  // instances being added (or restored), and the queries and mutations to 
  // modify them.
  const info = Object.fromEntries(
    names.map(name => [
      name,
      {
        instances: instances[name],
        getQry: `all${name.charAt(0).toUpperCase() + name.slice(1)}`,
        delQry: `delete${name.charAt(0).toUpperCase() + name.slice(1)}`,
        addQry: `add${name.charAt(0).toUpperCase() + name.slice(1)}`,
        newIds: instances[name].map(x => x.id),
        oldInstances: [],
        obsoleteInstances: [],
        deletedInstances: []
      }
    ])
  )
  // Get the existing instances of the kind. These will be used to restore
  // existing instances in the case of a failure.
  for (const name of TopLevelKinds) {
    const obj = info[name]
    try {
      obj.oldInstances = await allInstances(obj.getQry, { svc })
      obj.obsoleteInstances = obj.oldInstances.filter(
        x => !obj.newIds.includes(x.id)
      )
    } catch (e) {
      // If for any reason the reading of the instances fails, then we
      // we can proceed no further.   Since we have made no changes to
      // the workspace, we can simply log an error message and then exit.
      logger.error(
        `Could not read existing ${name} instances from workspace ${modelId}.  ${e.message}`
      )
      return false
    }
  }

  // For top level objects, we assume that if a collection of instances
  // has been provided, then the list is exhastive.   Any instances that
  // exist in the store that are not explicitly listed in the collection
  // need to be removed.
  try {
    for (const name of TopLevelKinds) {
      // Iterate over the top level kinds, removing any obsoleted
      // instances.
      const obj = info[name]
      obj.deletedInstances = await deleteInstances(
        obj.delQry,
        { svc },
        { INPUT: obj.obsoleteInstances.map(x => x.id) }
      )
    }
  } catch (e) {
    // If the deletion of instances fails for any reason, then we make
    // an attempt to restore workspace to its previous condition.
    logger.error(
      `Could not delete existing instances from workspace ${modelId}. ${e.message}`
    )
    logger.info(
      `attempting to restore deleted instances to workspace ${modelId}.`
    )
    try {
      for (const name of TopLevelKinds) {
        const obj = info[name]
        await addInstances(obj.addQry, { svc }, { INPUT: obj.oldInstances })
      }
      logger.info(`restoration of workspace ${modelId} was successful.`)
      return false
    } catch (e) {
      // Restoring the workspace to its previous state has failed.
      const msg = `Add instances failed, and could not restore previous instances to workspace ${modelId}. ${e.message}`
      logger.error(msg)
      throw new Error(msg)
    }
  }

  // Now that the unused instances in the top level kinds have been removed, we
  // can add all thew new instances.
  try {
    for (const name of names) {
      // iterate over all the kinds (not just the top level ones), adding the
      // instances.
      const obj = info[name]
      await addInstances(obj.addQry, { svc }, { INPUT: obj.instances })
    }
    logger.info(`New instances added to workspace ${modelId}.`)
  } catch (e) {
    // if adding instances fails, then we need to try to restore to the previous
    // state.
    logger.error(
      `Could not write new instances to workspace ${modelId}. ${e.message}`
    )
    logger.info(`Attempting to restore old instances to workspace ${modelId}`)
    try {
      for (const name of TopLevelKinds) {
        const obj = info[name]
        await addInstances(obj.addQry, { svc }, { INPUT: obj.oldInstances })
      }
      logger.info(`restoration of workspace ${modelId} was successful.`)
      return false
    } catch (e) {
      // if restoration fails, then we exit with an error.
      const msg = `Add instances failed, and could not restore previous instances to workspace ${modelId}. ${e.message}`
      logger.error(msg)
      throw new Error(msg)
    }
  }
  // When everything is successful, return joyously triumphant!
  return true
}

module.exports = {
  persist: async (_, input) => persistModel(input)
}
