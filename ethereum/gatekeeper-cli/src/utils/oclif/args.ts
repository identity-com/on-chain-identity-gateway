import {isAddress} from '@ethersproject/address'
import {Command} from '@oclif/core'

type ArrayElement<ArrayType extends readonly unknown[] | undefined> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export const addressArg = ({name = 'address', description}: { name?: string, description: string }): ArrayElement<typeof Command.args> => ({
  name,
  required: true,
  description,
  parse: async (input: string) => {
    if (!isAddress(input)) throw new Error('Invalid Gateway Token address')
    return input
  },
})

