import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const defaultLevel = await prisma.userLevel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '普通用户',
      maxEmailAccounts: 5,
    },
  })

  console.log('Created default user level:', defaultLevel)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
