// server/user/userController.js
require('dotenv').config();
const { User } = require('../models/userModel');
const { Profile } = require('../models/profileModel');

// jwt 모듈을 사용하여 토큰을 발급합니다.
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

// bcrypt 모듈을 사용하여 비밀번호를 해싱합니다.
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// 중복을 확인하는 유틸리티 함수를 가져옵니다.
const { isUsernameTaken, isEmailTaken, isNicknameTaken } = require('../utils/userUtils');
const { deleteImage } = require('../middlewares/uploadMiddleware');
const { ProfileReport } = require('../models/reportModel');
const { addTokenToBlacklist } = require('../middlewares/authMiddleware');

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// nodemailer transporter 설정
const transporter = nodemailer.createTransport({
  service: 'Gmail', // 사용 중인 이메일 서비스 제공자
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const { Notification } = require('../models/notificationModel');

/**
 * 회원가입
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.registerUser = async (req, res) => {
  const { username, password, email, nickname, phoneNumber } = req.body;
  // 업로드된 이미지의 URL 가져오기
  const profileImage = req.file ? req.file.location : null;
  const createdAt = new Date();

  // 허용할 도메인 목록
  const allowedDomains = ['naver.com', 'kakao.com', 'nate.com'];

  // 허용할 특수문자 지정
  const allowedSpecialChars = '!@#$%^&*';

  // 정규표현식 생성
  const passwordRegex = new RegExp(
    `^(?=.*[A-Za-z])(?=.*\\d)(?=.*[${allowedSpecialChars}])[A-Za-z\\d${allowedSpecialChars}]{4,20}$`
  );

  // 비밀번호 유효성 검사
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      result: false,
      message: `비밀번호는 최소 4자 이상, 영문 대소문자, 숫자, 특수문자(${allowedSpecialChars.split('').join('')})를 각각 최소 하나 이상 포함해야 합니다.`
    });
  }

  try {
    // 이메일 도메인 추출
    const emailDomain = email.split('@')[1].toLowerCase();

    // 사용자 이름 중복 검사
    if (await isUsernameTaken(username)) {
      return res.status(400).json({
        result: false,
        message: '이미 사용 중인 사용자 이름입니다.'
      });
    }

    // 이메일 중복 검사
    if (await isEmailTaken(email)) {
      return res.status(400).json({
        result: false,
        message: '이미 사용 중인 이메일입니다.'
      });
    }

    if (await isNicknameTaken(nickname)) {
      return res.status(400).json({
        result: false,
        message: '이미 사용 중인 닉네임입니다.'
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 프로필 생성

    // 삼항 연산자 사용해서, profileImage 있으면 profileImage 넣고, 없으면 profileImage 넣지 않는다.
    const newProfile = profileImage
      ? new Profile({
        nickname: nickname,
        profileImage: profileImage,
      })
      : new Profile({
        nickname: nickname,
      });

    await newProfile.save();

    // 사용자 생성
    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      createdAt: createdAt,
      profiles: [newProfile._id],
      mainProfile: newProfile._id,
    });

    await newUser.save();

    res.status(201).json({
      result: true,
      message: '회원가입에 성공했습니다.'
    });
  } catch (err) {
    if (err.code === 11000) {
      const duplicatedField = Object.keys(err.keyValue)[0];
      res.status(400).json({
        result: false,
        message: `${duplicatedField}이 이미 사용 중입니다.`
      });
    } else if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      res.status(400).json({
        result: false,
        message: messages.join(', ')
      });
    } else {
      res.status(500).json({
        result: false,
        message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
  }
};

// 사용자 이름 중복 검사 API
exports.checkUsername = async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({
      result: false,
      message: 'username이 필요합니다.'
    });
  }

  try {
    if (await isUsernameTaken(username)) {
      return res.status(200).json({
        result: false,
        message: '이미 사용 중인 사용자 이름입니다.'
      });
    } else {
      return res.status(200).json({
        result: true,
        message: '사용 가능한 사용자 이름입니다.'
      });
    }
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 이메일 중복 검사 API 수정: email과 domain을 별도로 받음
exports.checkEmail = async (req, res) => {
  const { email, domain } = req.body;
  if (!email || !domain) {
    return res.status(400).json({
      result: false,
      message: 'email과 domain이 필요합니다.'
    });
  }

  try {
    if (await isEmailTaken(email, domain)) {
      return res.status(200).json({
        result: false,
        message: '이미 사용 중인 이메일입니다.'
      });
    } else {
      return res.status(200).json({
        result: true,
        message: '사용 가능한 이메일입니다.'
      });
    }
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 닉네임 중복 검사 API
exports.checkNickname = async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({
      result: false,
      message: '닉네임이 필요합니다.'
    });
  }

  try {
    if (await isNicknameTaken(nickname)) {
      return res.status(200).json({
        result: false,
        message: '이미 사용 중인 닉네임입니다.'
      });
    } else {
      return res.status(200).json({
        result: true,
        message: '사용 가능한 닉네임입니다.'
      });
    }
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 로그인 기능
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username, isDeleted: false });

    // 사용자 존재 여부와 비밀번호 검증을 통합
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET_KEY,
      { expiresIn: '3d' }
    );

    // 프로필 목록 구성
    const profiles = user.profiles.map(profile => ({
      id: profile._id,
      nickname: profile.nickname,
      profileImage: profile.profileImage,
      birthdate: profile.birthdate,
      // 필요한 다른 필드 추가
    }));

    //message, token user { userId, username, email, createdAt, profileId, nickname, profileImage, interests[]{subCategory} }
    res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        profiles: profiles,
      }
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

// 회원 탈퇴 (소프트 삭제)
exports.deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    if (!userId) {
      return res.status(400).json({ result: false, message: 'userId가 필요합니다.' });
    }

    const user = await User.findOneAndUpdate(
      { userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );
    if (!user) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      result: true,
      message: '사용자 계정이 성공적으로 삭제되었습니다.'
    });
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 유저의 프로필을 추가하는 함수
exports.addProfile = async (req, res) => {
  const userId = req.params.userId; // URL 파라미터에서 유저 ID 추출
  const { nickname, birthdate, mbti, intro, likeWork, likeSong } = req.body;
  const profileImage = req.file ? req.file.location : null;

  try {
    // 유저 찾기
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ result: false, message: '유저를 찾을 수 없습니다.' });
    }

    if (!nickname) {
      return res.status(400).json({ result: false, message: '닉네임이 필요합니다.' });
    }

    // 현재 프로필 수 확인
    if (user.profiles.length >= 5) {
      return res.status(400).json({ result: false, message: '프로필은 최대 5개까지 추가할 수 있습니다.' });
    }

    // 새 프로필 생성
    const newProfile = new Profile({
      nickname: nickname,
      profileImage: profileImage || null,
      birthdate: birthdate || null,
      mbti: mbti || null,
      introduction: intro || null,
      likeWork: likeWork || null,
      likeSong: likeSong || null,
    });

    await newProfile.save();

    // 프로필 ID 추가
    user.profiles.push(newProfile._id);

    // 유저 저장
    await user.save();

    res.status(200).json({ result: true, message: '프로필이 성공적으로 추가되었습니다.', data: newProfile });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// mainCategory에 따른 모든 subCategory 조회
exports.getSubCategories = async (req, res) => {
  const { mainCategory } = req.params;
  try {
    const profiles = await Profile.find({ 'interests.mainCategory': mainCategory });
    const subCategoriesSet = new Set();
    profiles.forEach(profile => {
      profile.interests.forEach(interest => {
        if (interest.mainCategory === mainCategory) {
          subCategoriesSet.add(interest.subCategory);
        }
      });
    });
    res.status(200).json({ subCategories: Array.from(subCategoriesSet) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 특정 프로필의 관심사를 조회하는 함수 추가
exports.getInterests = async (req, res) => {
  const { profileId } = req.params;
  try {
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      result: true,
      interests: profile.interests
    });
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 특정 프로필에 관심사를 추가하는 함수 추가
exports.addInterest = async (req, res) => {
  const { profileId } = req.params;
  const { mainCategory, subCategory, bias } = req.body;

  if (!mainCategory || !subCategory) {
    return res.status(400).json({
      result: false,
      message: 'mainCategory와 subCategory가 필요합니다.'
    });
  }

  try {
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.interests.length >= 5) {
      return res.status(400).json({ result: false, message: '관심사는 최대 5개까지 추가할 수 있습니다.' });
    }

    const newInterest = { mainCategory, subCategory, bias };
    profile.interests.push(newInterest);
    await profile.save();

    res.status(201).json({ result: true, message: '관심사가 성공적으로 추가되었습니다.', data: newInterest });
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 특정 프로필의 관심사를 subCategory 기준으로 삭제하는 함수 수정
exports.deleteInterest = async (req, res) => {
  const { profileId, subCategory } = req.params;

  try {
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    const interest = profile.interests.find(i => i.subCategory === subCategory);
    if (!interest) {
      return res.status(404).json({ result: false, message: '관심사를 찾을 수 없습니다.' });
    }

    profile.interests = profile.interests.filter(i => i.subCategory !== subCategory);
    await profile.save();

    res.status(200).json({
      result: true,
      message: '관심사가 성공적으로 삭제되었습니다.'
    });
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 특정 유저의 프로필 목록을 조회하는 함수 추가
exports.getUserProfiles = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('profiles', 'nickname');
    if (!user) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      result: true,
      profiles: user.profiles
    });
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 특정 프로필을 수정하는 함수 추가
exports.updateProfile = async (req, res) => {
  const { profileId } = req.params;
  const { nickname, birthdate, gender, mbti, intro, likeWork, likeSong } = req.body;
  const profileImage = req.file ? req.file.location : null;

  try {
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    // 기존 이미지가 있고 새로운 이미지가 업로드된 경우 기존 이미지 삭제
    if (profile.profileImage && profileImage) {
      await deleteImage(profile.profileImage);
      profile.profileImage = profileImage;
    } else if (profileImage) {
      profile.profileImage = profileImage;
    }

    // 기타 필드 업데이트
    if (nickname !== undefined) profile.nickname = nickname;
    if (birthdate !== undefined) profile.birthdate = birthdate;
    if (gender !== undefined) profile.gender = gender;
    if (mbti !== undefined) profile.mbti = mbti;
    if (intro !== undefined) profile.introduction = intro;
    if (likeWork !== undefined) profile.likeWork = likeWork;
    if (likeSong !== undefined) profile.likeSong = likeSong;

    profile.updatedAt = new Date();

    await profile.save();

    res.status(200).json({ result: true, message: '프로필이 성공적으로 업데이트되었습니다.', data: profile });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필을 조회하는 함수 추가
exports.getProfile = async (req, res) => {
  // 현재 프로필: 요청한 사용자의 프로필 ID, 조회 대상 프로필: query로 전달된 ID
  const { profileId } = req.params;
  const { targetProfileId } = req.query;
  try {
    const targetProfile = await Profile.findById(targetProfileId).populate('topFriends', 'nickname profileImage');
    if (!targetProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }
    const currentProfile = await Profile.findById(profileId);
    if (!currentProfile) {
      return res.status(404).json({ result: false, message: '현재 프로필을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      result: true,
      info: {
        nickname: targetProfile.nickname,
        profileImage: targetProfile.profileImage,
        birthdate: targetProfile.birthdate,
        gender: targetProfile.gender,
        mbti: targetProfile.mbti,
        likeWork: targetProfile.likeWork,
        likeSong: targetProfile.likeSong,
        intro: targetProfile.introduction,
      },
      interests: targetProfile.interests,
      followingState: currentProfile.following.includes(targetProfileId),
      followingCount: targetProfile.following.length,
      followersCount: targetProfile.followers.length,
      topFriends: targetProfile.topFriends
    });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 사용자 팔로우 기능
exports.followUser = async (req, res) => {
  const userId = req.user.id; // 토큰에서 추출한 사용자 ID
  const targetUserId = req.params.userId; // 팔로우할 사용자 ID

  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    if (user.following.includes(targetUserId)) {
      return res.status(400).json({ result: false, message: '이미 팔로우 중입니다.' });
    }

    user.following.push(targetUserId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    res.status(200).json({ result: true, message: '팔로우 성공' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 사용자 언팔로우 기능
exports.unfollowUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    if (!user.following.includes(targetUserId)) {
      return res.status(400).json({ result: false, message: '팔로우 중이 아닙니다.' });
    }

    user.following.pull(targetUserId);
    targetUser.followers.pull(userId);

    await user.save();
    await targetUser.save();

    res.status(200).json({ result: true, message: '언팔로우 성공' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 수정된 프로필 검색 기능
exports.searchProfiles = async (req, res) => {
  const { profileId, q, interests, curProfileId } = req.query;
  const nickname = q;
  try {
    const query = {};

    if (profileId) {
      query._id = profileId;
    }

    if (nickname) {
      query.nickname = { $regex: nickname, $options: 'i' };
    }

    if (interests) {
      const interestsArray = Array.isArray(interests) ? interests : [interests];
      query['interests.subCategory'] = { $in: interestsArray };
    }

    const profiles = await Profile.find(query).select('nickname profileImage mbti gender interests');
    let resultProfiles = profiles;

    if (curProfileId) {
      const currentProfile = await Profile.findById(curProfileId).select('following');
      if (currentProfile) {
        const followingSet = new Set(currentProfile.following.map(id => id.toString()));
        resultProfiles = profiles.map(profile => {
          const isFollowed = followingSet.has(profile._id.toString());
          return {
            ...profile.toObject(),
            isFollowed,
          };
        });
      }
    }

    res.status(200).json({ result: true, profiles: resultProfiles });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 프로필의 topFriends 조회 기능 추가
exports.getTopFriends = async (req, res) => {
  const { profileId } = req.params;
  try {
    const profile = await Profile.findById(profileId).populate('topFriends', 'nickname profileImage');
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    res.status(200).json({ result: true, topFriends: profile.topFriends });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 프로필에 topFriends 추가 기능
exports.addTopFriend = async (req, res) => {
  const { profileId } = req.params;
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({
      result: false,
      message: 'friendId가 필요합니다.'
    });
  }

  try {
    const profile = await Profile.findById(profileId);
    const friendProfile = await Profile.findById(friendId);

    if (!profile || !friendProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.topFriends.includes(friendId)) {
      return res.status(400).json({ result: false, message: '이미 topFriend에 등록된 프로필입니다.' });
    }

    profile.topFriends.push(friendId);
    await profile.save();

    res.status(200).json({ result: true, message: 'topFriend가 성공적으로 추가되었습니다.', topFriends: profile.topFriends });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 프로필에서 topFriends 삭제 기능
exports.deleteTopFriend = async (req, res) => {
  const { profileId, friendId } = req.params;

  try {
    const profile = await Profile.findById(profileId);

    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (!profile.topFriends.includes(friendId)) {
      return res.status(400).json({ result: false, message: 'topFriend에 등록되지 않은 프로필입니다.' });
    }

    profile.topFriends = profile.topFriends.filter(id => id.toString() !== friendId);
    await profile.save();

    res.status(200).json({ result: true, message: 'topFriend가 성공적으로 삭제되었습니다.', topFriends: profile.topFriends });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

exports.reportProfile = async (req, res) => {
  const { profileId } = req.params;
  const { category, content } = req.body;
  const reporterId = req.user.id;

  if (!category || !content) {
    return res.status(400).json({
      result: false,
      message: 'category와 content가 필요합니다.',
    });
  }

  try {
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    const newReport = new ProfileReport({
      profile: profileId,
      reporter: reporterId,
      category,
      content,
    });

    await newReport.save();

    res.status(201).json({ result: true, message: '프로필이 성공적으로 신고되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필 차단
exports.blockProfile = async (req, res) => {
  const { profileId } = req.params;
  const { blockedProfileId } = req.body;

  if (!blockedProfileId) {
    return res.status(400).json({
      result: false,
      message: 'blockedProfileId가 필요합니다.',
    });
  }

  try {
    const profile = await Profile.findById(profileId);
    const blockedProfile = await Profile.findById(blockedProfileId);

    if (!profile || !blockedProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.blockedProfiles.includes(blockedProfileId)) {
      return res.status(400).json({ result: false, message: '이미 차단된 프로필입니다.' });
    }

    profile.blockedProfiles.push(blockedProfileId);
    await profile.save();

    res.status(200).json({ result: true, message: '프로필이 성공적으로 차단되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필 차단 해제
exports.unblockProfile = async (req, res) => {
  const { profileId, blockedProfileId } = req.params;

  try {
    const profile = await Profile.findById(profileId);

    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (!profile.blockedProfiles.includes(blockedProfileId)) {
      return res.status(400).json({ result: false, message: '차단된 프로필이 아닙니다.' });
    }

    profile.blockedProfiles = profile.blockedProfiles.filter(id => id.toString() !== blockedProfileId);
    await profile.save();

    res.status(200).json({ result: true, message: '프로필의 차단이 해제되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필 숨기기
exports.hideProfile = async (req, res) => {
  const { profileId } = req.params;
  const { hiddenProfileId } = req.body;

  if (!hiddenProfileId) {
    return res.status(400).json({
      result: false,
      message: 'hiddenProfileId가 필요합니다.',
    });
  }

  try {
    const profile = await Profile.findById(profileId);
    const hiddenProfile = await Profile.findById(hiddenProfileId);

    if (!profile || !hiddenProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.hiddenProfiles.includes(hiddenProfileId)) {
      return res.status(400).json({ result: false, message: '이미 숨겨진 프로필입니다.' });
    }

    profile.hiddenProfiles.push(hiddenProfileId);
    await profile.save();

    res.status(200).json({ result: true, message: '프로필이 성공적으로 숨겨졌습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필 숨기기 해제
exports.unhideProfile = async (req, res) => {
  const { profileId, hiddenProfileId } = req.params;

  try {
    const profile = await Profile.findById(profileId);

    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (!profile.hiddenProfiles.includes(hiddenProfileId)) {
      return res.status(400).json({ result: false, message: '숨겨진 프로필이 아닙니다.' });
    }

    profile.hiddenProfiles = profile.hiddenProfiles.filter(id => id.toString() !== hiddenProfileId);
    await profile.save();

    res.status(200).json({ result: true, message: '프로필 숨기기가 해제되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필을 팔로우하는 함수
exports.followProfile = async (req, res) => {
  // const { profileId, targetProfileId } = req.params;
  const { profileId, followingId } = req.params;

  if (profileId === followingId) {
    return res.status(400).json({ result: false, message: '자기 자신을 팔로우할 수 없습니다.' });
  }

  try {
    const profile = await Profile.findById(profileId);
    const targetProfile = await Profile.findById(followingId);

    if (!profile || !targetProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.following.includes(followingId)) {
      return res.status(400).json({ result: false, message: '이미 팔로우하고 있는 프로필입니다.' });
    }

    profile.following.push(followingId);
    targetProfile.followers.push(profileId);

    await profile.save();
    await targetProfile.save();

    res.status(200).json({ result: true, message: '프로필을 성공적으로 팔로우했습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필의 팔로우를 해제하는 함수
exports.unfollowProfile = async (req, res) => {
  // const { profileId, targetProfileId } = req.params;
  const { profileId, followingId } = req.params;

  try {
    const profile = await Profile.findById(profileId);
    const targetProfile = await Profile.findById(followingId);

    if (!profile || !targetProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (!profile.following.includes(followingId)) {
      return res.status(400).json({ result: false, message: '팔로우하고 있지 않은 프로필입니다.' });
    }

    profile.following = profile.following.filter(id => id.toString() !== followingId);
    targetProfile.followers = targetProfile.followers.filter(id => id.toString() !== profileId);

    await profile.save();
    await targetProfile.save();

    res.status(200).json({ result: true, message: '프로필의 팔로우를 성공적으로 해제했습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필의 팔로잉 목록을 조회하는 함수
exports.getFollowingList = async (req, res) => {
  const { profileId } = req.params;

  try {
    const profile = await Profile.findById(profileId).populate('following', 'nickname profileImage');

    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    res.status(200).json({ result: true, following: profile.following });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필의 팔로워 목록을 조회하는 함수
exports.getFollowersList = async (req, res) => {
  const { profileId } = req.params;

  try {
    const profile = await Profile.findById(profileId).populate('followers', 'nickname profileImage');

    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    res.status(200).json({ result: true, followers: profile.followers });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필의 차단된 프로필 목록을 조회하는 함수 추가
exports.getBlockedProfiles = async (req, res) => {
  const { profileId } = req.params;
  try {
    const profile = await Profile.findById(profileId).populate('blockedProfiles', 'nickname profileImage');
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      result: true,
      blockedProfiles: profile.blockedProfiles
    });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 특정 프로필의 숨긴 프로필 목록을 조회하는 함수 추가
exports.getHiddenProfiles = async (req, res) => {
  const { profileId } = req.params;
  try {
    const profile = await Profile.findById(profileId).populate('hiddenProfiles', 'nickname profileImage');
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      result: true,
      hiddenProfiles: profile.hiddenProfiles
    });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 로그아웃 기능 수정
exports.logout = async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    addTokenToBlacklist(token);
  }
  res.status(200).json({ result: true, message: '로그아웃 되었습니다.' });
};

// 비밀번호 재설정 요청 함수 수정
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 인증번호 생성
    const authCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 숫자
    user.resetPasswordCode = authCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1시간 유효
    await user.save();

    // 이메일로 인증번호 전송
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: '비밀번호 재설정 인증번호',
      text: `비밀번호를 재설정하려면 다음 인증번호를 입력하세요:\n\n` +
        `${authCode}\n\n` +
        `인증번호는 1시간 동안 유효합니다.`,
    };
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        return res.status(500).json({ result: false, message: '이메일 전송에 실패했습니다.' });
      }
      res.status(200).json({ result: true, message: '인증번호가 이메일로 전송되었습니다.' });
    });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 비밀번호 재설정 함수 수정
exports.resetPassword = async (req, res) => {
  const { email, authCode, password } = req.body;
  try {
    const user = await User.findOne({
      email: email,
      resetPasswordCode: authCode,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ result: false, message: '인증번호가 유효하지 않거나 만료되었습니다.' });
    }
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ result: true, message: '비밀번호가 성공적으로 재설정되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 유저의 알림을 조회하는 함수
exports.getNotifications = async (req, res) => {
  const { profileId } = req.params;
  const { category } = req.query; // 카테고리 추가

  try {
    const query = { profile: profileId };
    if (category) {
      query.category = category;
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.status(200).json({ result: true, notifications });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

exports.deleteProfile = async (req, res) => {
  const { userId, profileId } = req.params;

  try {
    const user = await User.findById(userId).populate('profiles');
    if (!user) {
      return res.status(404).json({ result: false, message: '유저를 찾을 수 없습니다.' });
    }

    const profileCount = user.profiles.length;
    if (profileCount <= 1) {
      return res.status(400).json({ result: false, message: '삭제할 수 없습니다. 프로필은 최소 하나 이상 존재해야합니다.' });
    }

    const profile = await Profile.findByIdAndDelete(profileId);
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    // 유저의 profiles 배열에서도 삭제된 프로필을 제거합니다.
    user.profiles.pull(profileId);
    if (user.mainProfile.toString() === profileId) {
      user.mainProfile = user.profiles[0] || null;
    }
    await user.save();

    res.status(200).json({ result: true, message: '프로필이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

exports.getUserIdByUsername = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }
    res.status(200).json({ result: true, userId: user._id }); f
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

exports.resetPasswordWithPhoneNumber = async (req, res) => {
  const { username, phoneNumber, newPassword } = req.body;

  try {
    const user = await User.findOne({ username, phoneNumber });
    if (!user) {
      return res.status(400).json({ result: false, message: '사용자 정보가 일치하지 않습니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ result: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// 이메일과 휴대폰 번호로 사용자 ID 찾기
exports.findUserId = async (req, res) => {
  const { email, phoneNumber } = req.body;

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      result: false,
      message: '유효한 이메일 형식이 아닙니다.'
    });
  }

  // 휴대폰 번호 형식 검증 (10-15자리 숫자)
  const phoneRegex = /^\d{10,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      result: false,
      message: '유효한 휴대폰 번호 형식이 아닙니다.'
    });
  }

  try {
    const user = await User.findOne({ email: email, phoneNumber: phoneNumber });

    if (!user) {
      return res.status(404).json({
        result: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    if (user.isDeleted) {
      return res.status(404).json({
        result: false,
        message: '이미 탈퇴한 사용자입니다.'
      });
    }

    res.status(200).json({
      result: true,
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

exports.checkUserExistence = async (req, res) => {
  const { username, phoneNumber } = req.body;

  // 데이터 유효성 검사
  if (!username || !phoneNumber) {
    return res.status(400).json({
      result: false,
      message: 'username과 phoneNumber가 필요합니다.',
    });
  }

  try {
    const user = await User.findOne({ username, phoneNumber });

    if (!user) {
      return res.status(404).json({
        result: false,
        message: '유효한 사용자가 아닙니다.',
      });
    }

    res.status(200).json({
      result: true,
    });
  } catch (error) {
    res.status(500).json({
      result: false,
      message: error.message,
    });
  }
};

exports.requestPasswordReset = async (req, res) => {

};

exports.updatePassword = async (req, res) => {
  const { username, newPassword } = req.body;

  // 데이터 유효성 검사
  if (!username || !newPassword) {
    return res.status(400).json({
      result: false,
      message: 'username과 newPassword가 필요합니다.',
    });
  }

  // 비밀번호 유효성 검사
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{4,20}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      result: false,
      message: '비밀번호는 최소 4자 이상, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.'
    });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ result: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};