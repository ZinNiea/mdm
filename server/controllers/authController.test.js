const { requestVerificationCode } = require('./authController');
const smsService = require('../services/smsService');
const redisService = require('../services/redisService');

jest.mock('../services/smsService');
jest.mock('../services/redisService');

describe('requestVerificationCode', () => {
  it('should save verification code and send SMS', async () => {
    const req = { body: { phoneNumber: '1234567890' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    redisService.saveVerificationCode.mockResolvedValue();
    smsService.sendSMS.mockResolvedValue();

    await requestVerificationCode(req, res);

    expect(redisService.saveVerificationCode).toHaveBeenCalledWith('1234567890', expect.any(String));
    expect(smsService.sendSMS).toHaveBeenCalledWith('1234567890', expect.stringContaining('인증번호는'));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ result: true, message: '인증번호가 전송되었습니다.' });
  });
});