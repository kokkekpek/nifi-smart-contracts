import {TonClient} from '@tonclient/core'
import {libNode} from '@tonclient/lib-node'
import KitInterface from '../../library/ton/utils/interfaces/KitInterface'
import Ton from '../../library/ton/utils/Ton'
import {KeyPair} from '@tonclient/core/dist/modules'
import TonKeysFile from '../../library/ton/utils/node/TonKeysFile'
import TerminalContractInfo from '../../library/scripts/base/TerminalContractInfo'
import terminalDeploy from '../../library/scripts/base/functions/terminalDeploy'
import colors from 'colors'
import config from '../../configs/config'
import GiverV2 from '../../library/ton/contracts/GiverV2'
import ArtRoot from '../../contracts/ArtRoot'

async function run(): Promise<void> {
    TonClient.useBinaryLibrary(libNode)
    const kit: KitInterface = Ton.kit.create(config.net.deploy)
    /*const artRootKeys: KeyPair = await TonKeysFile.createRandomIfNotExist(
        config.net.deploy.contracts.artRoot.keyFile,
        kit.client
    )
    console.log(artRootKeys.public);
    console.log(artRootKeys.secret);*/
    const artRootKeys: KeyPair = 
        {public: '14b14ad580f32938e5e55e86d7252d3b60f89d7b0ac5c38398ccc04f55e132ab',
         secret: 'c75ca9e512edb5d810d5f12befccd783ed80e7b989f6ad2b75003b54df2b5149'}
    const giverKeys: KeyPair = await TonKeysFile.createRandomIfNotExist(config.net.deploy.keys.giver, kit.client)
    const artRoot: ArtRoot = new ArtRoot(kit, artRootKeys)
    const giver: GiverV2 = new GiverV2(kit, giverKeys)

    await TerminalContractInfo.logNetwork(config.net.deploy)
    await TerminalContractInfo.log()
    await TerminalContractInfo.logAccount('Giver', giver, config.net.deploy.locale)
    await TerminalContractInfo.log()
    await TerminalContractInfo.logAccount('ArtRoot', artRoot, config.net.deploy.locale)
    await TerminalContractInfo.log()
    //process.exit()
    const balance: number = parseInt(await artRoot.getBalance())
    if (balance === 0) {
        await TerminalContractInfo.log('SENDING...')
        await giver.sendTransaction(await artRoot.calculateAddress(), config.net.deploy.contracts.artRoot.giverDeposit)
        await artRoot.waitForTransaction()
        await TerminalContractInfo.log(colors.green('SENT'))
        await TerminalContractInfo.log()
        await TerminalContractInfo.logAccount('Giver', giver, config.net.deploy.locale)
        await TerminalContractInfo.log()
        await TerminalContractInfo.logAccount('ArtRoot', artRoot, config.net.deploy.locale)
        await TerminalContractInfo.log()
    }

    const canDeploy: boolean = await terminalDeploy(artRoot)
    if (!canDeploy)
        process.exit()

    const artRootConfig: any = config.net.deploy.contracts.artRoot
    await artRoot.deploy(
        artRootConfig.manager,
        artRootConfig.creationMinValue,
        artRootConfig.creationFee,
        Ton.hex.string(artRootConfig.name),
        Ton.hex.string(artRootConfig.symbol)
    )
    await TerminalContractInfo.log(colors.green('DEPLOYED'))
    await TerminalContractInfo.log()
    await TerminalContractInfo.logAccount('Giver', giver, config.net.deploy.locale)
    await TerminalContractInfo.log()
    await TerminalContractInfo.logAccount('ArtRoot', artRoot, config.net.deploy.locale)
    await TerminalContractInfo.log()
    process.exit()
}
run().then()