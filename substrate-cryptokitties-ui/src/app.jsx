import React from 'react';
require('semantic-ui-css/semantic.min.css');
const { generateMnemonic } = require('bip39')
import { Icon, List, Label, Header, Segment, Divider, Button } from 'semantic-ui-react';
import { Bond, TransformBond } from 'oo7';
import { ReactiveComponent, If, Rspan } from 'oo7-react';
import { calls, runtime, chain, system, runtimeUp, ss58Encode, addressBook, secretStore } from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import { AccountIdBond, SignerBond } from './AccountIdBond.jsx';
import { BalanceBond } from './BalanceBond.jsx';
import { InputBond } from './InputBond.jsx';
import { TransactButton } from './TransactButton.jsx';
import { FileUploadBond } from './FileUploadBond.jsx';
import { StakingStatusLabel } from './StakingStatusLabel';
import { WalletList, SecretItem } from './WalletList';
import { AddressBookList } from './AddressBookList';
import { TransformBondButton } from './TransformBondButton';
import { Pretty } from './Pretty';
import { KittyCards } from './KittyCards.jsx';

export class App extends ReactiveComponent {
	constructor() {
		super([], { ensureRuntime: runtimeUp })

		// For debug only.
		window.runtime = runtime;
		window.secretStore = secretStore;
		window.addressBook = addressBook;
		window.chain = chain;
		window.calls = calls;
		window.that = this;

		this.source = new Bond;
		this.amount = new Bond;
		this.destination = new Bond;
		this.nick = new Bond;
		this.lookup = new Bond;
		this.name = new Bond;
		this.seed = new Bond;
		this.seedAccount = this.seed.map(s => s ? secretStore().accountFromPhrase(s) : undefined)
		this.seedAccount.use()
		this.runtime = new Bond;
		this.ckaccount = new Bond;
		this.ckkitty = new Bond;
		this.ckprice = new Bond;

		addCodecTransform('Kitty<Hash,Balance>', { name: 'Vec<u8>', dna: 'Hash', price: 'Balance' });
	}

	readyRender() {
		return (<div>
			<div>
				<Label>Name <Label.Detail>
					<Pretty className="value" value={system.name} /> v<Pretty className="value" value={system.version} />
				</Label.Detail></Label>
				<Label>Chain <Label.Detail>
					<Pretty className="value" value={system.chain} />
				</Label.Detail></Label>
				<Label>Runtime <Label.Detail>
					<Pretty className="value" value={runtime.version.specName} /> v<Pretty className="value" value={runtime.version.specVersion} /> (
						<Pretty className="value" value={runtime.version.implName} /> v<Pretty className="value" value={runtime.version.implVersion} />
					)
				</Label.Detail></Label>
				<Label>Height <Label.Detail>
					<Pretty className="value" value={chain.height} />
				</Label.Detail></Label>
				<Label>Authorities <Label.Detail>
					<Rspan className="value">{
						runtime.core.authorities.mapEach(a => <Identicon key={a} account={a} size={16} />)
					}</Rspan>
				</Label.Detail></Label>
			</div>
			<Segment style={{ margin: '1em' }}>
				<Header as='h2'>
					<Icon name='key' />
					<Header.Content>
						Wallet
						<Header.Subheader>Manage your secret keys</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>seed</div>
					<InputBond
						bond={this.seed}
						reversible
						placeholder='Some seed for this key'
						validator={n => n || null}
						action={<Button content="Another" onClick={() => this.seed.trigger(generateMnemonic())} />}
						iconPosition='left'
						icon={<i style={{ opacity: 1 }} className='icon'><Identicon account={this.seedAccount} size={28} style={{ marginTop: '5px' }} /></i>}
					/>
				</div>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>name</div>
					<InputBond
						bond={this.name}
						placeholder='A name for this key'
						validator={n => n ? secretStore().map(ss => ss.byName[n] ? null : n) : null}
						action={<TransformBondButton
							content='Create'
							transform={(name, seed) => secretStore().submit(seed, name)}
							args={[this.name, this.seed]}
							immediate
						/>}
					/>
				</div>
				<div style={{ paddingBottom: '1em' }}>
					<WalletList />
				</div>
			</Segment>
			<Divider hidden />
			<Segment style={{ margin: '1em' }} padded>
				<Header as='h2'>
					<Icon name='search' />
					<Header.Content>
						Address Book
						<Header.Subheader>Inspect the status of any account and name it for later use</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>lookup account</div>
					<AccountIdBond bond={this.lookup} />
					<If condition={this.lookup.ready()} then={<div>
						<Label>Balance
							<Label.Detail>
								<Pretty value={runtime.balances.balance(this.lookup)} />
							</Label.Detail>
						</Label>
						<Label>Nonce
							<Label.Detail>
								<Pretty value={runtime.system.accountNonce(this.lookup)} />
							</Label.Detail>
						</Label>
						<Label>Address
							<Label.Detail>
								<Pretty value={this.lookup} />
							</Label.Detail>
						</Label>
					</div>} />
				</div>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>name</div>
					<InputBond
						bond={this.nick}
						placeholder='A name for this address'
						validator={n => n ? addressBook().map(ss => ss.byName[n] ? null : n) : null}
						action={<TransformBondButton
							content='Add'
							transform={(name, account) => { addressBook().submit(account, name); return true }}
							args={[this.nick, this.lookup]}
							immediate
						/>}
					/>
				</div>
				<div style={{ paddingBottom: '1em' }}>
					<AddressBookList />
				</div>
			</Segment>
			<Divider hidden />
			<Segment style={{ margin: '1em' }} padded>
				<Header as='h2'>
					<Icon name='send' />
					<Header.Content>
						Send Funds
						<Header.Subheader>Send funds from your account to another</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>from</div>
					<SignerBond bond={this.source} />
					<If condition={this.source.ready()} then={<span>
						<Label>Balance
							<Label.Detail>
								<Pretty value={runtime.balances.balance(this.source)} />
							</Label.Detail>
						</Label>
						<Label>Nonce
							<Label.Detail>
								<Pretty value={runtime.system.accountNonce(this.source)} />
							</Label.Detail>
						</Label>
					</span>} />
				</div>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>to</div>
					<AccountIdBond bond={this.destination} />
					<If condition={this.destination.ready()} then={
						<Label>Balance
							<Label.Detail>
								<Pretty value={runtime.balances.balance(this.destination)} />
							</Label.Detail>
						</Label>
					} />
				</div>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>amount</div>
					<BalanceBond bond={this.amount} />
				</div>
				<TransactButton
					content="Send"
					icon='send'
					tx={{
						sender: runtime.balances.tryIndex(this.source),
						call: calls.balances.transfer(this.destination, this.amount)
					}}
				/>
			</Segment>
			<Divider hidden />
			<Segment style={{ margin: '1em' }} padded>
				<Header as='h2'>
					<Icon name='search' />
					<Header.Content>
						Runtime Upgrade
						<Header.Subheader>Upgrade the runtime using the UpgradeKey module</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{ paddingBottom: '1em' }}></div>
				<FileUploadBond bond={this.runtime} content='Select Runtime' />
				<TransactButton
					content="Upgrade"
					icon='warning'
					tx={{
						sender: runtime.upgrade_key.key,
						call: calls.upgrade_key.upgrade(this.runtime)
					}}
				/>
			</Segment>
			<Divider hidden />
			<Segment style={{ margin: '1em' }} padded>
				<Header as='h2'>
					<Icon name='paw' />
					<Header.Content>
						Cryptokitties on Substrate
						<Header.Subheader>There are <Pretty value={runtime.cryptokitties.kittiesCount}/> kitties purring.</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{ paddingBottom: '1em' }}></div>
				<KittyCards value={runtime.cryptokitties.kittiesCount}/>
				<div style={{ paddingBottom: '1em' }}></div>
				<SignerBond bond={this.ckaccount} />
				<If condition={this.ckaccount.ready()} then={<div>
					<Label>Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.ckaccount)} />
						</Label.Detail>
					</Label>
					<Label>Kitties
						<Label.Detail>
							<Pretty value={runtime.cryptokitties.ownerToKitties(this.ckaccount)} />
						</Label.Detail>
					</Label>
				</div>} />

				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>kitty</div>
					<InputBond
						bond={this.ckkitty}
						reversible
						placeholder='Kitty ID'
						validator={n => n || null}
						iconPosition='left'
						icon="paw"
					/>
				</div>
				<div style={{ paddingBottom: '1em' }}>
					<div style={{ fontSize: 'small' }}>amount</div>
					<BalanceBond bond={this.ckprice} />
				</div>
				<TransactButton
					content="Send"
					icon='send'
					tx={{
						sender: runtime.balances.tryIndex(this.ckaccount),
						call: calls.cryptokitties.setPrice(this.ckkitty, this.ckprice)
					}}
				/>
			</Segment>
		</div>);
	}
}

