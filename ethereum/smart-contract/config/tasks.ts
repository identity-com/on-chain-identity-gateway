import {task} from "hardhat/config";
import {checkGT} from "../tasks/checkGT";
import {createGatekeeperNetwork} from "../tasks/createGatekeeperNetwork";
import {addGatekeeper} from "../tasks/addGatekeeper";
import {removeGatekeeper} from "../tasks/removeGatekeeper";
import {issueGT} from "../tasks/issueGT";
import {fund} from "../tasks/fund";
import {printPrivateKey} from "../tasks/printPrivateKey";
import {createWallet} from "../tasks/createWallet";
import {addForwarder} from "../tasks/addForwarder";
import {execute} from "../tasks/execute";
import {getBalance} from "../tasks/getBalance";

const defaultPath = './contracts';
const testContractsPath = './test/contracts';

task('check-gt', 'check if a wallet has a gateway token for a particular gatekeeper network')
    .addParam('address', 'The wallet to check')
    .addParam('gatekeepernetwork', 'The gatekeeper network')
    .setAction(checkGT);
task('create-gatekeeper-network', 'create a gatekeeper network')
    .addParam('gatekeepernetwork', 'The gatekeeper network to create')
    .addParam('gatekeeper', 'The gatekeeper to add')
    .addParam('name', 'The name of the new gatekeeper network')
    .setAction(createGatekeeperNetwork);
task('add-gatekeeper', 'add a gatekeeper to a network')
    .addParam('gatekeeper', 'The gatekeeper to add')
    .addParam('gatekeepernetwork', 'The gatekeeper network to add the gatekeeper to')
    .setAction(addGatekeeper);
task('check-gatekeeper', 'check if a gatekeeper is in a network')
    .addParam('gatekeeper', 'The gatekeeper to check')
    .addParam('gatekeepernetwork', 'The gatekeeper network')
    .setAction(addGatekeeper);
task('remove-gatekeeper', 'remove a gatekeeper from a network')
    .addParam('gatekeeper', 'The gatekeeper to remove')
    .addParam('gatekeepernetwork', 'The gatekeeper network to remove the gatekeeper from')
    .setAction(removeGatekeeper);
task('issue-gt', 'issue a gateway token')
    .addParam('gatekeepernetwork', 'The gatekeeper network to issue the token against')
    .addParam('address', 'The wallet to issue the gateway token for')
    .addFlag('forwarded', 'Forwards the transaction using an ERC2771 forwarder')
    .setAction(issueGT);
task('fund', 'fund a wallet')
    .addParam('from', 'The funder wallet')
    .addParam('to', 'The wallet to fund')
    .addParam('amount', 'The amount in eth to send')
    .addFlag('dryrun', 'Do not actually send the transaction')
    .setAction(fund);
task(
    'print-private-key',
    'Print the private key of a wallet used by hardhat (WARNING - DO NOT USE THIS FOR PRODUCTION KEYS)',
)
    .addParam('index', 'the index of the wallet to get the private key for')
    .setAction(printPrivateKey);
task('create-wallet', 'Create a test wallet').setAction(createWallet);
task('add-forwarder', 'add a forwarder to the gateway token smart contract (e.g. to support a relayer)')
    .addParam('forwarder', 'The forwarder to add')
    .setAction(addForwarder);
task('execute', 'sign and send a transaction')
    .addParam('tx', 'the transaction to sign as a hex string')
    .addParam('to', 'the recipient of the transaction')
    .addParam('value', 'the amount to send with the transaction')
    .setAction(execute);
task('get-balance', 'get the balance of the deployer').setAction(getBalance);

// Override the default "compile" task to compile both main and test contracts
task('compile', 'Compiles the entire project, including main and test contracts')
    .addFlag('noTestContracts', "Don't compile test contracts")
    .setAction(async (args, hre, runSuper) => {
        // First, compile main contracts
        hre.config.paths.sources = defaultPath;
        await runSuper(args);

        // Then, compile test contracts (unless --noTestContracts flag is provided)
        if (!args.noTestContracts) {
            hre.config.paths.sources = testContractsPath;
            await runSuper(args);
        }
    });