const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateIdenticon = require("../utils/generateIdenticon");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 新規ユーザー登録API
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const defaultIdenticonImage = generateIdenticon(email);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      profile: {
        create: {
          bio: "はじめまして",
          profileImageUrl: defaultIdenticonImage,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  return res.json({ user });
});

//ユーザーログインAPI
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  console.log(user);

  if (!user) {
    return res.status(401).json({ error: "ユーザーは存在しません。" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log(isPasswordValid);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "パスワードが間違っています。" });
  }

  const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });
  return res.json({ token });
});

module.exports = router;
