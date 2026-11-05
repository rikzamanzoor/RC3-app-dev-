const membersService = require('../services/membersService');

function getMembers(req, res, next) {
  try {
    const members = membersService.getAllMembers();
    res.status(200).json(members);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMembers
};

