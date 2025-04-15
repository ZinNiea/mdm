// server/controllers/profileController.js
const { Request, Response } = require('express');
const { Profile } = require('../models/profileModel'); // Profile 모델을 가져옵니다.
const { User } = require('../models/userModel'); // User 모델을 가져옵니다.
const { deleteImage } = require('../middlewares/uploadMiddleware'); // 이미지 삭제 함수

/**
 * 특정 프로필의 관심사를 조회하는 함수
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @returns {Promise<void>}
 */
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

/**
 * 특정 프로필에 관심사를 추가하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필의 관심사를 subCategory 기준으로 삭제하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필을 업데이트하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필을 조회하는 함수
 *
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필을 삭제하는 함수
 *  
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 프로필을 검색하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필의 topFriends를 조회하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필에 topFriends를 추가하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필의 topFriends를 삭제하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필을 차단하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
exports.blockProfile = async (req, res) => {
  const { profileId, blockedProfileId } = req.params;
  // const { blockedProfileId } = req.body;

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

/**
 * 특정 프로필의 차단을 해제하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필을 숨기는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
exports.hideProfile = async (req, res) => {
  const { profileId, hiddenProfileId } = req.params;
  // const { hiddenProfileId } = req.body;

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

/**
 * 특정 프로필의 숨기기를 해제하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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

/**
 * 특정 프로필을 팔로우하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
exports.followProfile = async (req, res) => {
  const { profileId, followingProfileId } = req.params;

  if (profileId === followingProfileId) {
    return res.status(400).json({ result: false, message: '자기 자신을 팔로우할 수 없습니다.' });
  }

  try {
    const profile = await Profile.findById(profileId);
    const targetProfile = await Profile.findById(followingProfileId);

    if (!profile || !targetProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.following.includes(followingProfileId)) {
      return res.status(400).json({ result: false, message: '이미 팔로우하고 있는 프로필입니다.' });
    }

    profile.following.push(followingProfileId);
    targetProfile.followers.push(profileId);

    await profile.save();
    await targetProfile.save();

    // 알림 생성: 팔로우한 프로필에게 알림 전달
    await createNotification(
      targetProfile._id,
      '커뮤니티',
      `${profile.nickname}님이 당신의 프로필을 팔로우했습니다.`,
      `community/${profileId}`
    );

    res.status(200).json({ result: true, message: '프로필을 성공적으로 팔로우했습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

/**
 * 특정 프로필의 팔로우를 해제하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
exports.unfollowProfile = async (req, res) => {
  const { profileId, followingProfileId } = req.params;

  try {
    const profile = await Profile.findById(profileId);
    const targetProfile = await Profile.findById(followingProfileId);

    if (!profile || !targetProfile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (!profile.following.includes(followingProfileId)) {
      return res.status(400).json({ result: false, message: '팔로우하고 있지 않은 프로필입니다.' });
    }

    profile.following = profile.following.filter(id => id.toString() !== followingProfileId);
    targetProfile.followers = targetProfile.followers.filter(id => id.toString() !== profileId);

    await profile.save();
    await targetProfile.save();

    res.status(200).json({ result: true, message: '프로필의 팔로우를 성공적으로 해제했습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

/**
 * 특정 프로필의 팔로워 목록을 조회하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
exports.getFollowers = async (req, res) => {
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

/**
 * 특정 프로필의 팔로잉 목록을 조회하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
exports.getFollowings = async (req, res) => {
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

/**
 * 특정 프로필의 차단 목록을 조회하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

/**
 * 특정 프로필의 숨김 목록을 조회하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
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
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};