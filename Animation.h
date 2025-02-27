#pragma once

#include <deque>
#include <memory>

class Animation {
	friend class AnimationManager;
private:
	bool started = false;
	bool finished = false;
	bool interrupted = false;
	double timeElapsed = 0;
	bool operator ()(const double timeDelta);
public:
	virtual void onStart();
	// return true if finished
	virtual bool stepFrame(const double timeElapsed, const double timeDelta) = 0;
	virtual void onFinished();
	virtual void onInterrupted();
	bool isStarted() const;
	bool isFinished() const;
	bool isInterrupted() const;
	void interrupt();
};

class AnimationManager {
private:
	typedef std::deque<std::shared_ptr<Animation>> Queue;
	size_t queueIndex = 0;
	Queue queue[2];

	Queue & getFrontQueue();
	Queue & getBackQueue();
	void swapQueue();

public:
	AnimationManager & push(std::shared_ptr<Animation> animation);
	void step(const double timeDelta, const bool interrupted = false);
	void clear();
};