module.exports = {
  useEmployeeAPI() {
    return (
      String(process.env.USE_EMPLOYEE_API || "false").toLowerCase() === "true"
    );
  },
};
